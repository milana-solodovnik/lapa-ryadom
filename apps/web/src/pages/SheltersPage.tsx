import { Link } from 'react-router-dom';
import { fetchShelters } from '../api/client.js';
import { useAsync } from '../api/useAsync.js';
import styles from '../features/needs/Needs.module.css';

export function SheltersPage(): JSX.Element {
  const { data, loading, error } = useAsync(
    (signal) => fetchShelters({}, signal),
    []
  );

  return (
    <section>
      <h1>Приюты</h1>
      <p>
        Здесь опубликованы приюты, которые принимают вещевую помощь. У каждого указано, когда и где
        можно привезти.
      </p>

      {error && <div className={styles.error}>Не удалось загрузить: {error}</div>}
      {loading && <p>Загрузка…</p>}

      {!loading && !error && (
        <div className="shelter-list">
          {(data?.items ?? []).map((s) => (
            <article key={s.id} className={styles.cardNormal}>
              <div className={styles.cardBody}>
                <h2 className={styles.title}>
                  <Link to={`/shelters/${s.id}`}>{s.name}</Link>
                </h2>
                <p className={styles.shelterLine}>
                  {s.city} · активных потребностей: {s.activeNeedsCount}
                </p>
                {s.description && <p>{s.description}</p>}
                <p className={styles.shelterLine}>Приём: {s.receivingHours}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}