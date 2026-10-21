import { Link, useParams } from 'react-router-dom';
import { fetchNeed } from '../api/client.js';
import { useAsync } from '../api/useAsync.js';
import { categoryLabel, unitLabel } from '../api/types.js';
import styles from '../features/needs/Needs.module.css';

function formatQty(value: string): string {
  return BigInt(value).toLocaleString('ru-RU');
}

export function NeedDetailPage(): JSX.Element {
  const { needId } = useParams<{ needId: string }>();
  const { data: need, loading, error } = useAsync(
    (signal) => fetchNeed(needId as string, signal),
    [needId]
  );

  if (loading) return <p>Загрузка…</p>;
  if (error) return <div className={styles.error}>Не удалось загрузить: {error}</div>;
  if (!need) return <div className={styles.error}>Потребность не найдена.</div>;

  const urgent = need.priority === 'urgent';
  const available = BigInt(need.availableQty);
  const soldOut = available === 0n;

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
                <label htmlFor="qty">Сколько вы можете привезти?</label>
                <div className="offer-cta-row">
                  <input
                    id="qty"
                    type="number"
                    min={1}
                    max={Number(need.availableQty)}
                    defaultValue={1}
                  />
                  <span>{unitLabel(need.unit)}</span>
                  <button type="button" disabled title="Появится в DEV-07">
                    Предложить помощь
                  </button>
                </div>
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