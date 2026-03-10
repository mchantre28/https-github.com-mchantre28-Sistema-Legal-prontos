/**
 * Formulário de fatura — React + TypeScript
 * Serviços e despesas dinâmicos, preview de totais em tempo real
 */

import React, { useState, useEffect } from 'react';
import type { Client, ClientAddress, ClientType } from '../models/client';
import type { Invoice, InvoiceService, InvoiceExpense } from '../models/invoice';
import { calculateInvoiceTotals } from '../utils/calculateInvoiceTotals';

const EMPTY_ADDRESS: ClientAddress = {
  rua: '',
  codigoPostal: '',
  localidade: '',
  pais: 'Portugal',
};

const emptyClient = (): Client => ({
  id: '',
  nome: '',
  nif: '',
  tipo: 'particular',
  morada: { ...EMPTY_ADDRESS },
});

const emptyService = (): InvoiceService => ({
  id: crypto.randomUUID(),
  descricao: '',
  quantidade: 1,
  precoUnitario: 0,
  iva: 'isento_art53',
  aplicarRetencao: true,
});

const emptyExpense = (): InvoiceExpense => ({
  id: crypto.randomUUID(),
  descricao: '',
  valor: 0,
  iva: 'isento',
});

interface InvoiceFormProps {
  /** Cliente inicial (pode ser editado no formulário) */
  client?: Client;
  onSubmit: (invoice: Invoice) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  client: initialClient,
  onSubmit,
}) => {
  const [client, setClient] = useState<Client>(initialClient ?? emptyClient());
  const [servicos, setServicos] = useState<InvoiceService[]>([emptyService()]);
  const [despesas, setDespesas] = useState<InvoiceExpense[]>([]);
  const [ivaExemption, setIvaExemption] = useState<'ARTIGO_53' | null>('ARTIGO_53');
  const [ivaTaxaNormal, setIvaTaxaNormal] = useState(23);
  const [retencaoPercent, setRetencaoPercent] = useState(23);
  const [retencaoAplicavel, setRetencaoAplicavel] = useState(
    (initialClient ?? client).tipo === 'empresa'
  );
  const [previewTotals, setPreviewTotals] = useState<Invoice['totais'] | null>(null);

  useEffect(() => {
    if (initialClient) setClient(initialClient);
  }, [initialClient?.id]);

  useEffect(() => {
    setRetencaoAplicavel(client.tipo === 'empresa');
  }, [client.tipo]);

  useEffect(() => {
    const totais = calculateInvoiceTotals({
      servicos,
      despesas,
      retencaoAplicavel,
      ivaExemption,
      ivaTaxaNormal,
      retencaoPercent,
    });
    setPreviewTotals(totais);
  }, [
    servicos,
    despesas,
    retencaoAplicavel,
    ivaExemption,
    ivaTaxaNormal,
    retencaoPercent,
  ]);

  const updateClient = <K extends keyof Client>(field: K, value: Client[K]) => {
    setClient((prev) => ({ ...prev, [field]: value }));
  };

  const updateMorada = <K extends keyof ClientAddress>(field: K, value: ClientAddress[K]) => {
    setClient((prev) => ({
      ...prev,
      morada: { ...prev.morada, [field]: value },
    }));
  };

  const updateService = (
    id: string,
    field: keyof InvoiceService,
    value: InvoiceService[keyof InvoiceService]
  ) => {
    setServicos((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeService = (id: string) => {
    setServicos((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };

  const updateExpense = (
    id: string,
    field: keyof InvoiceExpense,
    value: InvoiceExpense[keyof InvoiceExpense]
  ) => {
    setDespesas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeExpense = (id: string) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      clienteId: client.id || crypto.randomUUID(),
      clienteSnapshot: client,
      servicos,
      despesas,
      retencaoAplicavel,
      ivaExemption,
      ivaTaxaNormal,
      retencaoPercent,
      totais: calculateInvoiceTotals({
        servicos,
        despesas,
        retencaoAplicavel,
        ivaExemption,
        ivaTaxaNormal,
        retencaoPercent,
      }),
      criadoEm: new Date(),
    };
    onSubmit(invoice);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, fontFamily: 'sans-serif' }}>
      <h2>Nova fatura</h2>

      {/* Dados do cliente */}
      <section style={{ marginBottom: 24 }}>
        <h3>Cliente</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Nome
            <input
              type="text"
              value={client.nome}
              onChange={(e) => updateClient('nome', e.target.value)}
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            NIF
            <input
              type="text"
              value={client.nif}
              onChange={(e) => updateClient('nif', e.target.value)}
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            Tipo
            <select
              value={client.tipo}
              onChange={(e) => updateClient('tipo', e.target.value as ClientType)}
              style={{ display: 'block', width: '100%' }}
            >
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>
          </label>
          <label>
            Rua
            <input
              type="text"
              value={client.morada.rua}
              onChange={(e) => updateMorada('rua', e.target.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label>
              Número
              <input
                type="text"
                value={client.morada.numero ?? ''}
                onChange={(e) => updateMorada('numero', e.target.value)}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Andar
              <input
                type="text"
                value={client.morada.andar ?? ''}
                onChange={(e) => updateMorada('andar', e.target.value)}
                placeholder="ex: 3º DTO"
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              Código postal
              <input
                type="text"
                value={client.morada.codigoPostal}
                onChange={(e) => updateMorada('codigoPostal', e.target.value)}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              Localidade
              <input
                type="text"
                value={client.morada.localidade}
                onChange={(e) => updateMorada('localidade', e.target.value)}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
            <label>
              País
              <input
                type="text"
                value={client.morada.pais}
                onChange={(e) => updateMorada('pais', e.target.value)}
                style={{ display: 'block', width: '100%' }}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Configuração fiscal */}
      <section style={{ marginBottom: 24 }}>
        <h3>Configuração fiscal</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={ivaExemption === 'ARTIGO_53'}
              onChange={(e) =>
                setIvaExemption(e.target.checked ? 'ARTIGO_53' : null)
              }
            />
            Isenção de IVA (Art. 53 do CIVA)
          </label>
          <label>
            Taxa IVA normal (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={ivaTaxaNormal}
              onChange={(e) => setIvaTaxaNormal(Number(e.target.value))}
              disabled={ivaExemption === 'ARTIGO_53'}
              style={{ display: 'block', width: 120 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={retencaoAplicavel}
              onChange={(e) => setRetencaoAplicavel(e.target.checked)}
              disabled={client.tipo !== 'empresa'}
            />
            Retenção na fonte (apenas empresas)
          </label>
          {retencaoAplicavel && (
            <label>
              Percentagem de retenção (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={retencaoPercent}
                onChange={(e) => setRetencaoPercent(Number(e.target.value))}
                style={{ display: 'block', width: 120 }}
              />
            </label>
          )}
        </div>
      </section>

      {/* Serviços */}
      <section style={{ marginBottom: 24 }}>
        <h3>Serviços</h3>
        {servicos.map((s) => (
          <div
            key={s.id}
            style={{
              border: '1px solid #ccc',
              padding: 12,
              marginBottom: 8,
              display: 'grid',
              gridTemplateColumns: '1fr 60px 80px auto auto auto',
              gap: 8,
              alignItems: 'end',
            }}
          >
            <input
              type="text"
              placeholder="Descrição"
              value={s.descricao}
              onChange={(e) => updateService(s.id, 'descricao', e.target.value)}
              required
            />
            <input
              type="number"
              min={0}
              step={1}
              value={s.quantidade}
              onChange={(e) =>
                updateService(s.id, 'quantidade', Number(e.target.value))
              }
            />
            <input
              type="number"
              min={0}
              step={0.01}
              value={s.precoUnitario}
              onChange={(e) =>
                updateService(s.id, 'precoUnitario', Number(e.target.value))
              }
            />
            <select
              value={s.iva}
              onChange={(e) =>
                updateService(s.id, 'iva', e.target.value as InvoiceService['iva'])
              }
              disabled={ivaExemption === 'ARTIGO_53'}
            >
              <option value="isento_art53">Isento</option>
              <option value="taxa_normal">Taxa normal</option>
            </select>
            {retencaoAplicavel && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={s.aplicarRetencao}
                  onChange={(e) =>
                    updateService(s.id, 'aplicarRetencao', e.target.checked)
                  }
                />
                Retenção
              </label>
            )}
            <button
              type="button"
              onClick={() => removeService(s.id)}
              disabled={servicos.length <= 1}
              style={{ justifySelf: 'end' }}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServicos((prev) => [...prev, emptyService()])}
        >
          + Adicionar serviço
        </button>
      </section>

      {/* Despesas */}
      <section style={{ marginBottom: 24 }}>
        <h3>Despesas</h3>
        {despesas.length === 0 ? (
          <p style={{ color: '#666' }}>Sem despesas. Adicione emolumentos, certidões, etc.</p>
        ) : (
          despesas.map((d) => (
            <div
              key={d.id}
              style={{
                border: '1px solid #ccc',
                padding: 12,
                marginBottom: 8,
                display: 'grid',
                gridTemplateColumns: '1fr 100px auto auto',
                gap: 8,
                alignItems: 'end',
              }}
            >
              <input
                type="text"
                placeholder="Descrição (emolumentos, certidões, deslocações...)"
                value={d.descricao}
                onChange={(e) => updateExpense(d.id, 'descricao', e.target.value)}
                required
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={d.valor}
                onChange={(e) =>
                  updateExpense(d.id, 'valor', Number(e.target.value))
                }
              />
              <select
                value={d.iva}
                onChange={(e) =>
                  updateExpense(d.id, 'iva', e.target.value as InvoiceExpense['iva'])
                }
              >
                <option value="isento">Isento</option>
                <option value="taxa_normal">Taxa normal</option>
              </select>
              <button type="button" onClick={() => removeExpense(d.id)}>
                Remover
              </button>
            </div>
          ))
        )}
        <button
          type="button"
          onClick={() => setDespesas((prev) => [...prev, emptyExpense()])}
        >
          + Adicionar despesa
        </button>
      </section>

      {/* Preview totais */}
      <section style={{ marginBottom: 24, padding: 16, background: '#f5f5f5' }}>
        <h3>Totais (preview)</h3>
        {previewTotals && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>Subtotal serviços: {previewTotals.subtotalServicos.toFixed(2)} €</li>
            <li>Subtotal despesas: {previewTotals.subtotalDespesas.toFixed(2)} €</li>
            <li>IVA: {previewTotals.ivaTotal.toFixed(2)} €</li>
            {retencaoAplicavel && (
              <li>Retenção na fonte: -{previewTotals.retencaoTotal.toFixed(2)} €</li>
            )}
            <li style={{ fontWeight: 'bold', marginTop: 8 }}>
              Total a pagar: {previewTotals.totalPagar.toFixed(2)} €
            </li>
          </ul>
        )}
      </section>

      <button type="submit">Emitir fatura</button>
    </form>
  );
};
