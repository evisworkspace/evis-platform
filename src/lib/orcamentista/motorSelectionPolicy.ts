import {
  OrcamentistaAiMotorId,
  OrcamentistaAiMotorRole,
  OrcamentistaMotorCapability,
  OrcamentistaMotorRiskProfile,
  OrcamentistaMotorSelectionPolicy,
  OrcamentistaReadingSourceQuality,
} from '../../types';

export type OrcamentistaMotorSelectionContext = {
  role?: OrcamentistaAiMotorRole;
  source_quality?: OrcamentistaReadingSourceQuality;
  contains_critical_dimension?: boolean;
  contains_quantitative_table?: boolean;
  contains_foundation_reading?: boolean;
  contains_inference?: boolean;
  confidence_score?: number;
  agreement_score?: number;
  review_goal?: 'structured_reading' | 'safety_check' | 'qualitative_review' | 'final_audit';
};

export const ORCAMENTISTA_MOTOR_CAPABILITIES: OrcamentistaMotorCapability[] = [
  {
    id: 'gpt_5_5',
    name: 'GPT-5.5',
    role: ['primary_reader', 'final_auditor', 'conservative_verifier'],
    recommended_for: [
      'Reader primario inicial',
      'estrutura JSON rigida',
      'auditoria final',
      'organizacao de evidencias',
      'revisao de consistencia entre campos',
    ],
    not_recommended_for: [
      'consolidacao automatica sem HITL',
      'dimensao critica sem Verifier independente',
      'quantitativo final sem checagem deterministica',
    ],
    strengths: [
      'boa organizacao de resposta',
      'boa capacidade de auditoria',
      'bom equilibrio geral no benchmark externo',
    ],
    weaknesses: [
      'ainda exige schema rigido',
      'pode manter confianca alta se o contrato nao for restritivo',
      'nao substitui sanity check deterministico',
    ],
    cost_profile: 'alto',
    risk_profile: 'medio',
  },
  {
    id: 'gemini_3_1',
    name: 'Gemini 3.1',
    role: ['conservative_verifier', 'safety_checker'],
    recommended_for: [
      'Verifier conservador',
      'safety check',
      'bloqueio quando leitura for incerta',
      'segunda leitura para dimensoes criticas',
    ],
    not_recommended_for: [
      'Reader primario de tabelas pequenas',
      'Reader primario de imagens comprimidas',
      'extracao unica de quantitativos em baixa legibilidade',
    ],
    strengths: [
      'tende a bloquear dado ilegivel',
      'bom perfil conservador para verificacao',
      'util para reduzir falso positivo de leitura',
    ],
    weaknesses: [
      'falhou como Reader primario em tabelas/imagens comprimidas',
      'pode perder detalhe fino quando a fonte visual e ruim',
      'nao deve consolidar sozinho',
    ],
    cost_profile: 'medio',
    risk_profile: 'baixo',
  },
  {
    id: 'claude',
    name: 'Claude',
    role: ['qualitative_reviewer', 'specialist_support'],
    recommended_for: [
      'analise textual',
      'documentacao',
      'compatibilizacao qualitativa',
      'revisao de narrativa tecnica',
      'apoio a agentes especialistas sem extrair dimensao critica sozinho',
    ],
    not_recommended_for: [
      'leitura dimensional critica sem Verifier/HITL',
      'profundidade de estaca como fonte unica',
      'quantitativo final sem validacao deterministica',
    ],
    strengths: [
      'boa leitura ampla',
      'boa sintese textual',
      'util para compatibilizacao narrativa',
    ],
    weaknesses: [
      'benchmark apontou erro critico de dimensao com confianca alta',
      'nao deve decidir cota critica sozinho',
      'risco elevado em leitura numerica isolada',
    ],
    cost_profile: 'alto',
    risk_profile: 'alto',
  },
];

export const ORCAMENTISTA_MOTOR_SELECTION_POLICY: OrcamentistaMotorSelectionPolicy = {
  id: 'orcamentista-motor-selection-policy-3a',
  version: '3A',
  default_by_role: {
    primary_reader: 'gpt_5_5',
    conservative_verifier: 'gemini_3_1',
    final_auditor: 'gpt_5_5',
    qualitative_reviewer: 'claude',
    specialist_support: 'claude',
    safety_checker: 'gemini_3_1',
  },
  motors: ORCAMENTISTA_MOTOR_CAPABILITIES,
  critical_dimension_policy: [
    'Nenhum motor consolida dimensao critica sozinho.',
    'Dimensao critica exige Reader, Verifier independente e sanity check deterministico.',
    'Divergencia numerica critica exige HITL e bloqueia consolidacao.',
    'Quantitativo final e deterministico mais HITL, nunca resposta direta de motor.',
  ],
  cost_benefit_policy: [
    'Usar GPT-5.5 quando estrutura, rastreabilidade e auditoria forem prioritarias.',
    'Usar Gemini 3.1 como Verifier conservador e safety checker em leituras incertas.',
    'Usar Claude para revisao qualitativa e compatibilizacao textual, sem dimensao critica isolada.',
    'Evitar multiplos motores em texto simples de baixo risco; exigir multiplos motores em cota critica.',
  ],
  generated_at: '2026-05-05T14:00:00.000Z',
};

export function getMotorPolicy(motorId: OrcamentistaAiMotorId) {
  return ORCAMENTISTA_MOTOR_SELECTION_POLICY.motors.find((motor) => motor.id === motorId);
}

export function getRecommendedMotorForRole(role: OrcamentistaAiMotorRole) {
  const motorId = ORCAMENTISTA_MOTOR_SELECTION_POLICY.default_by_role[role];
  return motorId ? getMotorPolicy(motorId) : undefined;
}

export function shouldUseSecondaryVerifier(context: OrcamentistaMotorSelectionContext) {
  if (context.contains_critical_dimension) return true;
  if (context.contains_foundation_reading) return true;
  if (context.contains_quantitative_table && context.source_quality !== 'readable_table') return true;
  if (context.source_quality === 'raster_pdf_low_resolution') return true;
  if (context.source_quality === 'compressed_image') return true;
  if (context.source_quality === 'illegible_table') return true;
  if (context.contains_inference) return true;
  if (context.confidence_score !== undefined && context.confidence_score < 0.85) return true;
  if (context.agreement_score !== undefined && context.agreement_score < 0.9) return true;

  return false;
}

export function shouldUseClaudeForQualitativeReview(context: OrcamentistaMotorSelectionContext) {
  if (context.contains_critical_dimension) return false;
  if (context.review_goal === 'qualitative_review') return true;
  if (context.role === 'qualitative_reviewer') return true;
  if (context.role === 'specialist_support' && !context.contains_quantitative_table) return true;

  return false;
}

export function getMotorRiskProfile(motorId: OrcamentistaAiMotorId): OrcamentistaMotorRiskProfile {
  return getMotorPolicy(motorId)?.risk_profile ?? 'critico';
}
