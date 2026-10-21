import { Link } from 'react-router-dom';
import type { Need } from '../../api/types.js';
import { categoryLabel, unitLabel } from '../../api/types.js';
import styles from './Needs.module.css';

function formatQty(value: string): string {
  const n = BigInt(value);
  return n.toLocaleString('ru-RU');
}

export function NeedCard({ need }: { need: Need }): JSX.Element {
  const urgent = need.priority === 'urgent';
  return (
    <article className={urgent ? styles.cardUrgent : styles.cardNormal}>
      <div className={styles.cardBody}>
        <h2 className={styles.title}>
          <Link to={`/needs/${need.id}`}>{need.title}</Link>
        </h2>
        <p className={styles.shelterLine}>
          <span className={urgent ? styles.badgeUrgent : styles.badgeNormal}>
            {urgent ? 'Срочно' : 'Обычный приоритет'}
          </span>
          <span className={styles.badgeCategory}>{categoryLabel(need.category)}</span>{' '}
          {need.shelter.name}, {need.shelter.city}
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
      </div>
    </article>
  );
}

export function NeedGrid({ needs }: { needs: Need[] }): JSX.Element {
  if (needs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>По этим условиям ничего не нашлось.</p>
        <p>Попробуйте снять часть фильтров.</p>
      </div>
    );
  }
  return (
    <div className="needs-grid">
      {needs.map((n) => (
        <NeedCard key={n.id} need={n} />
      ))}
    </div>
  );
}

export function NeedError({ message }: { message: string }): JSX.Element {
  return <div className={styles.error}>Не удалось загрузить список: {message}</div>;
}