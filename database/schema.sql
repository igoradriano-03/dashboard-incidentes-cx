-- =============================================================================
-- Dashboard de Gestão de Incidentes em CX — Sistema de Gestão de Incidentes e Inteligência Operacional
-- Schema do banco de dados PostgreSQL
-- =============================================================================
--
-- Convenções adotadas:
--   - Chaves primárias: SERIAL (inteiro autoincremento) para simplicidade
--     e clareza acadêmica (evita a discussão sobre UUID, que não agrega
--     valor demonstrável neste MVP).
--   - Enumerações (status, prioridade, perfil, tipo) implementadas com
--     VARCHAR + CHECK, em vez de tipos ENUM nativos do PostgreSQL. ENUMs
--     nativos são mais rígidos para alterar (exigem ALTER TYPE) e, para
--     um projeto de ADS, CHECK deixa a regra visível dentro da própria
--     tabela, facilitando a explicação na banca.
--   - Timestamps em TIMESTAMPTZ (com fuso horário), boa prática padrão.
--   - "setores" é uma tabela de apoio, sem vínculo obrigatório com
--     interações/atualizações neste MVP (decisão registrada na ETAPA 1:
--     nenhuma regra de negócio ou tela exige esse vínculo hoje).
-- =============================================================================

-- =============================================================================
-- FUNÇÃO AUXILIAR: atualizar automaticamente o campo atualizado_em
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- TABELA: usuarios
-- =============================================================================
CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha       VARCHAR(255) NOT NULL,               -- hash bcrypt, nunca texto puro
  perfil      VARCHAR(20)  NOT NULL DEFAULT 'Analista'
              CHECK (perfil IN ('Administrador', 'Analista')),
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABELA: categorias
-- =============================================================================
CREATE TABLE categorias (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(80) NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABELA: setores
-- Tabela de apoio / cadastro simples (Seção 13). Sem FK obrigatória com
-- interacoes ou atualizacoes_incidente neste MVP — ver nota no cabeçalho.
-- =============================================================================
CREATE TABLE setores (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(80) NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABELA: incidentes
-- Precisa existir antes de "casos" porque casos referencia incidentes.
-- =============================================================================
CREATE TABLE incidentes (
  id                 SERIAL PRIMARY KEY,
  codigo             VARCHAR(20)  NOT NULL UNIQUE,       -- ex: INC-001 (gerado pelo backend)
  nome               VARCHAR(150) NOT NULL,
  descricao          TEXT,
  categoria_id       INTEGER      NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  prioridade         VARCHAR(10)  NOT NULL
                     CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  status             VARCHAR(30)  NOT NULL DEFAULT 'Aberto'   -- RN07
                     CHECK (status IN ('Aberto', 'Em acompanhamento', 'Resolvido', 'Encerrado')),
  responsavel_id     INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- RN06
  data_abertura      DATE         NOT NULL DEFAULT CURRENT_DATE,
  data_encerramento  DATE,
  criado_em          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_incidentes_atualizado_em
BEFORE UPDATE ON incidentes
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();


-- =============================================================================
-- TABELA: casos
-- =============================================================================
CREATE TABLE casos (
  id               SERIAL PRIMARY KEY,
  numero_pedido    VARCHAR(50)  NOT NULL,
  cliente          VARCHAR(150) NOT NULL,
  data_pedido      DATE,
  data_contato     DATE         NOT NULL DEFAULT CURRENT_DATE,
  categoria_id     INTEGER      NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT, -- RN01
  prioridade       VARCHAR(10)  NOT NULL                                                -- RN03
                   CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  status           VARCHAR(30)  NOT NULL DEFAULT 'Novo'                                 -- RN02
                   CHECK (status IN (
                     'Novo', 'Em tratativa', 'Aguardando transportadora',
                     'Aguardando cliente', 'Aguardando financeiro',
                     'Resolvido', 'Cancelado'
                   )),
  responsavel_id   INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,             -- opcional (sem RN explícita)
  incidente_id     INTEGER      REFERENCES incidentes(id) ON DELETE SET NULL,           -- RN04 (associação opcional)
  link_atendimento TEXT,
  ultima_acao      TEXT,
  proxima_acao     TEXT,
  prazo            DATE,
  observacoes      TEXT,
  criado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_casos_atualizado_em
BEFORE UPDATE ON casos
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

-- RN10: um incidente encerrado não deve receber novos casos sem ser reaberto.
-- Implementado como trigger para garantir a integridade mesmo se a regra
-- for esquecida em alguma camada do backend no futuro.
CREATE OR REPLACE FUNCTION fn_validar_incidente_encerrado()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  IF NEW.incidente_id IS NOT NULL THEN
    SELECT status INTO v_status FROM incidentes WHERE id = NEW.incidente_id;
    IF v_status = 'Encerrado' THEN
      RAISE EXCEPTION
        'Não é possível associar o caso a um incidente encerrado (incidente_id=%). Reabra o incidente antes de vincular novos casos.',
        NEW.incidente_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_casos_valida_incidente_encerrado
BEFORE INSERT OR UPDATE OF incidente_id ON casos
FOR EACH ROW EXECUTE FUNCTION fn_validar_incidente_encerrado();


-- =============================================================================
-- TABELA: atualizacoes_incidente (timeline do incidente)
-- =============================================================================
CREATE TABLE atualizacoes_incidente (
  id            SERIAL PRIMARY KEY,
  incidente_id  INTEGER     NOT NULL REFERENCES incidentes(id) ON DELETE CASCADE, -- RN08
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  descricao     TEXT        NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABELA: interacoes (timeline do caso)
-- =============================================================================
CREATE TABLE interacoes (
  id          SERIAL PRIMARY KEY,
  caso_id     INTEGER     NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  tipo        VARCHAR(30) NOT NULL
              CHECK (tipo IN (
                'Atendimento inicial', 'Recontato', 'E-mail',
                'WhatsApp', 'Ligação', 'Interno', 'Outro'
              )),
  descricao   TEXT        NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- ÍNDICES
-- Colunas usadas com frequência em filtros, joins e nos cálculos do
-- dashboard (RN12) se beneficiam de índice.
-- =============================================================================
CREATE INDEX idx_casos_categoria_id     ON casos(categoria_id);
CREATE INDEX idx_casos_incidente_id     ON casos(incidente_id);
CREATE INDEX idx_casos_responsavel_id   ON casos(responsavel_id);
CREATE INDEX idx_casos_status           ON casos(status);
CREATE INDEX idx_incidentes_categoria_id ON incidentes(categoria_id);
CREATE INDEX idx_incidentes_responsavel_id ON incidentes(responsavel_id);
CREATE INDEX idx_incidentes_status      ON incidentes(status);
CREATE INDEX idx_interacoes_caso_id     ON interacoes(caso_id);
CREATE INDEX idx_atualizacoes_incidente_id ON atualizacoes_incidente(incidente_id);


-- =============================================================================
-- DADOS DE REFERÊNCIA (não são dados fictícios de demonstração — são o
-- vocabulário fixo do sistema, necessário para o sistema funcionar).
-- Os dados fictícios de casos/incidentes/interações ficam na ETAPA 11
-- (backend/src/database/seed.js), pois dependem de bcrypt para gerar
-- as senhas de usuário com segurança.
-- =============================================================================
INSERT INTO categorias (nome) VALUES
  ('Atraso'),
  ('Entrega'),
  ('Transportadora'),
  ('Produto faltante'),
  ('Brinde faltante'),
  ('Devolução'),
  ('Cancelamento'),
  ('Pagamento'),
  ('PIX'),
  ('Checkout'),
  ('Assinatura'),
  ('Divergência de informação'),
  ('Endereço/CEP'),
  ('Outros');

INSERT INTO setores (nome) VALUES
  ('CX'),
  ('Logística'),
  ('Transportadora'),
  ('Financeiro'),
  ('E-commerce'),
  ('Tecnologia'),
  ('Marketing'),
  ('Outros');
