import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchNeed, createOffer, newIdempotencyKey, ApiError } from '../api/client.js';
import { useAsync } from '../api/useAsync.js';
import { categoryLabel, unitLabel } from '../api/types.js';
import styles from '../features/needs/Needs.module.css';

function formatQty(value: string): string {
  return BigInt(value).toLocaleString('ru-RU');
}

export function NeedDetailPage(): JSX.Element {
  const { needId } = useParams<{ needId: string }>();
  const navigate = useNavigate();
  const { data: need, loading, error } = useAsync(
    (signal) => fetchNeed(needId as string, signal),
    [needId]
  );

  // Kept as raw text on purpose. Coercing on every keystroke made the field
  // un-clearable: emptying it produced Number('') === 0, the 0 || 1 fallback
  // put 1 straight back, and the next digit landed after that 1 — typing a new
  // quantity gave "15" instead of "5". The value is parsed and checked once, on
  // submit.
  const [quantityText, setQuantityText] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  if (loading) return <p>Загрузка…</p>;
  if (error) return <div className={styles.error}>Не удалось загрузить: {error}</div>;
  if (!need) return <div className={styles.error}>Потребность не найдена.</div>;

  const urgent = need.priority === 'urgent';
  const available = BigInt(need.availableQty);
  const soldOut = available === 0n;

  const submit = async (): Promise<void> => {
    const parsed = Number(quantityText);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setOfferError('Укажите целое количество не меньше 1');
      return;
    }
    if (BigInt(parsed) > available) {
      setOfferError(`Свободно только ${formatQty(need.availableQty)} ${unitLabel(need.unit)}`);
      return;
    }

    setSubmitting(true);
    setOfferError(null);
    try {
      const result = await createOffer({
        needId: need.id,
        quantity: parsed,
        // Generated once per attempt; a double click or a network retry with
        // the same key can never create two reservations.
        idempotencyKey: newIdempotencyKey(),
      });
      navigate('/offer/result', {
        state: { code: result.code, quantity: parsed, needTitle: need.title, expiresAt: result.expiresAt },
      });
    } catch (err) {
      setOfferError(err instanceof ApiError ? err.message : 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <p>
        <Link to="/needs">← Все потребности</Link>
      </p>

      <article className={urgent ? styles.cardUrgent : styles.cardNormal}>
        <div className={styles.cardBody}>
          <h1 className={styles.title}>{need.title}</h1>
          <p className={styles.shelterLine}>
            <span className={urgent ? styles.badgeUrgent : styles.badgeNormal}>
              {urgent ? 'Срочно' : 'Обычный приоритет'}
            </span>
            <span className={styles.badgeCategory}>{categoryLabel(need.category)}</span>{' '}
            <Link to={`/shelters/${need.shelter.id}`}>{need.shelter.name}</Link>, {need.shelter.city}
          </p>

          {need.details && <p>{need.details}</p>}

          <p>
            Приём: <strong>{need.shelter.receivingHours}</strong>
          </p>

          <div className={styles.counters}>
            <div>
              <div className={styles.counterLabel}>требуется</div>
              <div className={styles.counterValue}>
                {formatQty(need.targetQty)} {unitLabel(need.unit)}
              </div>
            </div>
            <div>
              <div className={styles.counterLabel}>обещано</div>
              <div className={styles.counterValue}>{formatQty(need.reservedQty)}</div>
            </div>
            <div>
              <div className={styles.counterLabel}>получено</div>
              <div className={styles.counterValue}>{formatQty(need.receivedQty)}</div>
            </div>
            <div>
              <div className={styles.counterLabel}>свободно</div>
              <div className={styles.counterValueAvailable}>
                {formatQty(need.availableQty)}
              </div>
            </div>
          </div>

          <div className="offer-cta">
            {soldOut ? (
              <p>
                Сейчас всё собрано. Если хотите помочь позже, загляните в другие потребности.
              </p>
            ) : (
              <>
                <label htmlFor="qty">
                  Сколько вы можете привезти? Свободно {formatQty(need.availableQty)}{' '}
                  {unitLabel(need.unit)}
                </label>
                <div className="offer-cta-row">
                  <input
                    id="qty"
                    type="number"
                    min={1}
                    max={Number(available)}
                    value={quantityText}
                    onChange={(e) => setQuantityText(e.target.value)}
                  />
                  <span>{unitLabel(need.unit)}</span>
                  <button type="button" onClick={() => void submit()} disabled={submitting}>
                    {submitting ? 'Отправляем…' : 'Предложить помощь'}
                  </button>
                </div>
                {offerError && <div className={styles.error}>{offerError}</div>}
                <p className="offer-hint">
                  Регистрация не нужна. Вы получите одноразовый код, который покажете в приюте.
                </p>
              </>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}