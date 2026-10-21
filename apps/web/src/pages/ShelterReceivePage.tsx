import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { createDelivery, ApiError } from '../api/client.js';
import {
  DeliveryResult,
  REP_ACCOUNTS,
  unitLabel,
} from '../api/types.js';

interface FormState {
  code: string;
  receivedQty: string;
  accountId: string;
}

const INITIAL: FormState = {
  code: '',
  receivedQty: '1',
  accountId: REP_ACCOUNTS[0]?.id ?? '',
};

export function ShelterReceivePage(): JSX.Element {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DeliveryResult | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(null);

    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z2-9-]+$/.test(code)) {
      setError('Код должен состоять из латиницы и цифр 2–9');
      return;
    }
    const qty = Number(form.receivedQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Количество должно быть целым положительным числом');
      return;
    }
    if (!form.accountId) {
      setError('Выберите представителя приюта');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDelivery({
        code,
        receivedQty: qty,
        accountId: form.accountId,
      });
      setDone(result);
      setForm(INITIAL);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Не удалось принять помощь. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function anotherDelivery() {
    setDone(null);
    setError(null);
    setForm(INITIAL);
  }

  return (
    <section className="receive-page">
      <header>
        <h1>Принять помощь</h1>
        <p className="muted">
          Шаг D2 сценария: даритель привёз помощь в приют. Введите код, который он получил на
          странице подтверждения. Код показывается один раз и записан как хеш, поэтому изменить
          решение «задним числом» через повторный ввод того же кода нельзя.
        </p>
      </header>

      {done && (
        <article className="receive-success">
          <h2>Принято ✓</h2>
          <dl>
            <div>
              <dt>Потребность</dt>
              <dd>{done.needTitle}</dd>
            </div>
            <div>
              <dt>Принято</dt>
              <dd>
                {done.receivedQty} {unitLabel(done.needUnit)} из {done.offerQty}{' '}
                {unitLabel(done.needUnit)}
              </dd>
            </div>
            <div>
              <dt>Осталось по потребности</dt>
              <dd>{done.remaining}</dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>{new Date(done.receivedAt).toLocaleString('ru-RU')}</dd>
            </div>
          </dl>
          <p className="muted">{done.notice}</p>
          <div className="receive-actions">
            <button type="button" onClick={anotherDelivery}>
              Принять ещё одну помощь
            </button>
            <Link to={`/needs/${done.needId}`}>Открыть потребность</Link>
          </div>
        </article>
      )}

      {!done && (
        <form onSubmit={onSubmit} className="receive-form">
          <label>
            <span>Представитель приюта</span>
            <select
              value={form.accountId}
              onChange={(e) => update('accountId', e.target.value)}
              disabled={submitting}
              required
            >
              {REP_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <small className="muted">
              В рабочей версии — это cookie-сессия после логина (DEV-09).
            </small>
          </label>

          <label>
            <span>Код с карточки дарителя</span>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              spellCheck={false}
              autoCapitalize="characters"
              autoCorrect="off"
              maxLength={32}
              disabled={submitting}
              required
            />
            <small className="muted">
              16 символов, латиница и цифры 2–9. Запятые и дефисы можно опустить.
            </small>
          </label>

          <label>
            <span>Принято (сколько фактически)</span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.receivedQty}
              onChange={(e) => update('receivedQty', e.target.value)}
              disabled={submitting}
              required
            />
            <small className="muted">
              Не больше, чем было обещано. Можно меньше — например, привезли часть товара.
            </small>
          </label>

          {error && <p className="error">{error}</p>}

          <div className="receive-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Принимаю…' : 'Подтвердить приём'}
            </button>
            <Link to="/">Отмена</Link>
          </div>

          <p className="muted small">
            Категория отображается на странице потребности:{' '}
            <Link to="/needs">весь каталог</Link>.
          </p>

          <details>
            <summary>Зачем эти странные буквы в коде?</summary>
            <p>
              Из 16-символьного алфавита убраны <code>0/O</code>, <code>1/I/L</code> — их путают
              на слух через стойку приюта. 32 символа × 16 позиций = 80 бит энтропии, коллизия
              практически невозможна. Подробнее — <code>docs/03_DATA_MODEL.md</code>, §3.
            </p>
          </details>
        </form>
      )}
    </section>
  );
}
