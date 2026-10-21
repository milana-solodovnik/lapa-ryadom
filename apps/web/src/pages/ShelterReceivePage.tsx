import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ApiError,
  createDelivery,
  logout as apiLogout,
  me as apiMe,
} from '../api/client.js';
import {
  DeliveryResult,
  SessionAccount,
  unitLabel,
} from '../api/types.js';
import styles from './ShelterReceive.module.css';

interface FormState {
  code: string;
  receivedQty: string;
}

const INITIAL: FormState = { code: '', receivedQty: '1' };

type AuthState =
  | { kind: 'loading' }
  | { kind: 'no_session' }
  | { kind: 'ready'; account: SessionAccount };

export function ShelterReceivePage(): JSX.Element {
  const [auth, setAuth] = useState<AuthState>({ kind: 'loading' });
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DeliveryResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await apiMe();
        if (!cancelled) setAuth({ kind: 'ready', account });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setAuth({ kind: 'no_session' });
        } else {
          setAuth({ kind: 'no_session' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (auth.kind !== 'ready') return;

    setSubmitting(true);
    try {
      const result = await createDelivery({
        code,
        receivedQty: qty,
      });
      setDone(result);
      setForm(INITIAL);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setAuth({ kind: 'no_session' });
        return;
      }
      setError(
        e instanceof ApiError ? e.message : 'Не удалось принять помощь. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    try {
      await apiLogout();
    } finally {
      setAuth({ kind: 'no_session' });
    }
  }

  function anotherDelivery() {
    setDone(null);
    setError(null);
    setForm(INITIAL);
  }

  if (auth.kind === 'loading') {
    return (
      <section className={styles.page}>
        <p className={styles.muted}>Проверяю сессию…</p>
      </section>
    );
  }
  if (auth.kind === 'no_session') {
    return <Navigate to="/login" replace />;
  }

  const account = auth.account;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Принять помощь</h1>
        <p className={styles.muted}>
          Шаг D2 сценария: даритель привёз помощь в приют. Введите код, который он получил
          на странице подтверждения. Код показывается один раз и записан как хеш, поэтому
          изменить решение «задним числом» через повторный ввод того же кода нельзя.
        </p>
      </header>

      <aside className={styles.sessionBar}>
        <span>
          Вход выполнен как{' '}
          <strong>
            {account.username} ({account.role})
          </strong>
          . Код будет закреплён за этим представителем.
        </span>
        <button type="button" onClick={onLogout} className="secondary">
          Сменить аккаунт
        </button>
      </aside>

      {done && (
        <article className={styles.success}>
          <h2>Принято ✓</h2>
          <dl>
            <dt>Потребность</dt>
            <dd>{done.needTitle}</dd>
            <dt>Принято</dt>
            <dd>
              {done.receivedQty} {unitLabel(done.needUnit)} из {done.offerQty}{' '}
              {unitLabel(done.needUnit)}
            </dd>
            <dt>Осталось по потребности</dt>
            <dd>{done.remaining}</dd>
            <dt>Время</dt>
            <dd>{new Date(done.receivedAt).toLocaleString('ru-RU')}</dd>
          </dl>
          <p className={styles.muted}>{done.notice}</p>
          <div className={styles.actions}>
            <button type="button" onClick={anotherDelivery}>
              Принять ещё одну помощь
            </button>
            <Link to={`/needs/${done.needId}`}>Открыть потребность</Link>
          </div>
        </article>
      )}

      {!done && (
        <form onSubmit={onSubmit} className={styles.form}>
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
            <small className={styles.muted}>
              16 символов, латиница и цифры 2–9. Дефисы можно опустить.
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
            <small className={styles.muted}>
              Не больше, чем было обещано. Можно меньше — например, привезли часть товара.
            </small>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Принимаю…' : 'Подтвердить приём'}
            </button>
            <Link to="/">Отмена</Link>
          </div>

          <p className={`${styles.muted} ${styles.small}`}>
            Категория отображается на странице потребности:{' '}
            <Link to="/needs">весь каталог</Link>.
          </p>

          <details>
            <summary>Зачем эти странные буквы в коде?</summary>
            <p>
              Из 16-символьного алфавита убраны <code>0/O</code>, <code>1/I/L</code> — их
              путают на слух через стойку приюта. 32 символа × 16 позиций = 80 бит
              энтропии, коллизия практически невозможна. Подробнее —{' '}
              <code>docs/03_DATA_MODEL.md</code>, §3.
            </p>
          </details>
        </form>
      )}
    </section>
  );
}
