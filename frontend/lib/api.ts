/* Same-origin client: browser talks only to Next.js /api/* (no backend URL, no keys in bundle).
   The API routes forward to FastAPI with the server-side SWARN_API_KEY. */
async function post<T>(path: string, body: any): Promise<T> {
  const r = await fetch(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}));
    throw new Error(`${path} → ${r.status}${detail?.detail ? `: ${detail.detail}` : ''}`);
  }
  return r.json();
}

export const api = {
  health: async () => ({ ok: true, proxy: true }),
  investigate: (message_text: string, upi_text: string, tx_hash: string) =>
    post<any>('/api/investigate', { message_text, upi_text, upi: {}, tx_hash }),
  controlPack: (upi_text: string, upi: any, entities: any[], current_destination: string) =>
    post<any>('/api/control-pack', { upi_text, upi, entities, current_destination }),
};

export const PRESETS = {
  praveen: {
    message: `Bhai good news! SEBI approved scheme hai, 2 din me double.\nPay Rs 50,000 to our investment partner abc-invest@upi pe bhejo.\nUPI ID: abc-invest@upi\nPhone: +91 98765 43210\nWebsite: www.abc-invest-profits.com\nTelegram: @abc_invest_official`,
    upi: `abc-invest@upi, Rs 50,000, 12:41 PM, UTR426118473902`,
    hash: `0x81F4a2c9d3E7b1A05c8D2f4e6A0b3C7d9E1f2A4b5c7d9e1f2a4b5c7d9e1f2a4b5c7d9e1f2`,
  },
  kavita: {
    message: `Namaste Kavita ji, NSDL se bol rahe hain. Rs 25,000 processing fee kavita-family@paytm pe bhejo, 5 lakh release hoga. Website: www.nsdl-unclaim-release.com Phone: +91 91234 56780`,
    upi: `kavita-family@paytm, Rs 25,000`,
    hash: ``,
  },
};
