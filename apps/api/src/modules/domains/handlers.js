import { sendJson } from '../../common/http.js';
import { listActiveDomains } from './repository.js';

export async function handleListDomains(_req, res) {
  const domains = await listActiveDomains();
  sendJson(res, 200, { ok: true, data: domains });
}

