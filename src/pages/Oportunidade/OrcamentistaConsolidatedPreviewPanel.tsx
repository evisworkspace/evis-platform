import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Layers, AlertTriangle, FileWarning, Eye, AlertCircle, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { MOCK_CONSOLIDATED_PREVIEW } from '../../lib/orcamentista/consolidatedPreviewMock';
import { getConsolidatedPreviewStatusLabel, calculatePreviewTotal, groupPreviewServicesByDiscipline } from '../../lib/orcamentista/consolidatedPreviewUtils';

export function OrcamentistaConsolidatedPreviewPanel() {
  const preview = MOCK_CONSOLIDATED_PREVIEW;
  const servicesByDiscipline = useMemo(() => groupPreviewServicesByDiscipline(preview.services), [preview.services]);

  const totalValue = calculatePreviewTotal(preview).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 shadow-sm">
        <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Layers className="h-5 w-5 text-indigo-600" />
                Preview Consolidado
              </CardTitle>
              <CardDescription className="text-indigo-700 mt-1">
                Prévia técnica-orçamentária gerada a partir dos outputs dos agentes. Ainda não é orçamento oficial.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                Fase 2H (Mock)
              </Badge>
              <Badge className={preview.can_consolidate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {getConsolidatedPreviewStatusLabel(preview.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
              <span className="text-xs text-slate-500 mb-1">Valor Estimado Total</span>
              <span className="text-xl font-bold text-slate-800">{totalValue}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 mb-1">Serviços</span>
              <span className="text-lg font-semibold text-slate-700">{preview.summary.total_services}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 mb-1">Confiança Média</span>
              <span className="text-lg font-semibold text-slate-700">{(preview.summary.average_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 mb-1">Rastreabilidade</span>
              <span className="text-lg font-semibold text-slate-700">{(preview.summary.traceability_score * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-orange-600 mb-1">Riscos</span>
              <span className="text-lg font-semibold text-orange-700">{preview.summary.total_risks}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-amber-600 mb-1">HITLs Pendentes</span>
              <span className="text-lg font-semibold text-amber-700">{preview.summary.total_hitls}</span>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-red-600 mb-1">Bloqueios</span>
              <span className="text-lg font-semibold text-red-700">{preview.summary.total_blockers}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Serviços Sugeridos
              </h3>
              
              {Object.entries(servicesByDiscipline).map(([discipline, services]) => (
                <div key={discipline} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 bg-slate-100 p-1 px-2 rounded">{discipline}</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                          <th scope="col" className="px-4 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Un.</th>
                          <th scope="col" className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                          <th scope="col" className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Custo Un.</th>
                          <th scope="col" className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-4 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Tipo/Origem</th>
                          <th scope="col" className="px-4 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Rastreabilidade</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(service => (
                          <tr key={service.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{service.description}</span>
                                <span className="mt-0.5 w-fit rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-600">
                                  Não oficial
                                </span>
                                {service.requires_hitl && (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" /> Requer HITL</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-slate-600">{service.unit}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-slate-600">{service.estimated_quantity.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-slate-600">{service.estimated_unit_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-slate-800">{service.estimated_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center gap-1">
                                {service.identification_type === 'identified' ? (
                                  <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Identificado</Badge>
                                ) : service.identification_type === 'inferred' ? (
                                  <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Inferido</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-700 border-slate-200">Manual</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {service.source_agent_ids.map(id => <span key={id} className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]" title={id}>Agente: {id}</span>)}
                                {service.source_page_refs.length > 0 && <span className="text-[9px] text-slate-400">Páginas: {service.source_page_refs.join(', ')}</span>}
                                {service.source_evidence_refs.length > 0 && <span className="text-[9px] text-slate-400">Evidências: {service.source_evidence_refs.join(', ')}</span>}
                                <span className="text-[9px] text-slate-400">Rastreabilidade pré-oficial</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Riscos Agregados
                </h3>
                {preview.risks.length > 0 ? (
                  <div className="space-y-2">
                    {preview.risks.map(risk => (
                      <div key={risk.id} className="bg-orange-50 border border-orange-100 p-3 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-orange-900">{risk.description}</span>
                          <Badge variant="outline" className="text-[10px] bg-white border-orange-200 text-orange-700 uppercase">{risk.severity}</Badge>
                        </div>
                        <p className="text-xs text-orange-700 mb-2">Impacto: {risk.impact}</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Fonte: {risk.source_agent_id}</span>
                          {risk.blocks_consolidation && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded flex items-center gap-1"><Lock className="h-3 w-3" /> Bloqueia Consolidação</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum risco apontado.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-amber-500" />
                  HITLs Pendentes
                </h3>
                {preview.hitls.length > 0 ? (
                  <div className="space-y-2">
                    {preview.hitls.map(hitl => (
                      <div key={hitl.id} className="bg-amber-50 border border-amber-100 p-3 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-amber-900">{hitl.title}</span>
                          <Badge variant="outline" className="text-[10px] bg-white border-amber-200 text-amber-700 uppercase">{hitl.severity}</Badge>
                        </div>
                        <p className="text-xs text-amber-700 mb-2">{hitl.reason}</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Agente: {hitl.source_agent_id}</span>
                          {hitl.source_references.length > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Refs: {hitl.source_references.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum HITL pendente nesta visualização.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Premissas
                </h3>
                {preview.premises.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {preview.premises.map(p => <li key={p.id}>{p.description}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhuma premissa destacada.</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  Exclusões
                </h3>
                {preview.exclusions.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {preview.exclusions.map(e => <li key={e.id}>{e.description}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhuma exclusão destacada.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-md p-4 border border-slate-200 mt-6 text-sm text-slate-600 flex flex-col gap-3">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <p className="font-medium text-indigo-900 mb-1">Avisos de Governança</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Este preview não grava em orcamento_itens.</li>
                    <li>Este preview não alimenta a proposta comercial.</li>
                    <li>Itens inferidos exigem validação humana antes da consolidação oficial.</li>
                  </ul>
                </div>
              </div>
              
              {preview.blockers.length > 0 && (
                <div className="bg-red-50 p-3 rounded border border-red-200 flex gap-2 items-start mt-2">
                  <Lock className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-red-800 block text-xs">Atenção: A consolidação está bloqueada.</span>
                    <span className="text-xs text-red-700 block mt-1">Motivo: {preview.blockers[0].reason}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            A consolidação requer a resolução de HITLs e bloqueios.
          </p>
          <Button disabled className="opacity-70 flex gap-2">
            {!preview.can_consolidate && <Lock className="h-4 w-4" />}
            Consolidar preview no orçamento oficial — fase futura
          </Button>
        </div>
      </Card>
    </div>
  );
}
