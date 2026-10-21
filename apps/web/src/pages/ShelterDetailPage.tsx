import { Link, useParams } from 'react-router-dom';
import { fetchShelter } from '../api/client.js';
import { useAsync } from '../api/useAsync.js';
import { NeedGrid, NeedError } from '../features/needs/NeedCard.js';
import styles from '../features/needs/Needs.module.css';

export function ShelterDetailPage(): JSX.Element {
  const { shelterId } = useParams<{ shelterId: string }>();
  const { data: shelter, loading, error } = useAsync(
    (signal) => fetchShelter(shelterId as string, signal),
    [shelterId]
  );

  if (loading) return <p>Загрузка…</p>;
  if (error) return <NeedError message={error} />;
  if (!shelter) return <div className={styles.error}>Приют не найден.</div>;

  return (
    <section>
      <p>
        <Link to="/shelters">← Все приюты</Link>
      </p>

      <h1>{shelter.name}</h1>
      <p className={styles.shelterLine}>
        {shelter.city} · {shelter.address}
      </p>
      {shelter.description && <p>{shelter.description}</p>}
      <p>
        <strong>Часы приёма:</strong> {shelter.receivingHours}
      </p>

      <h2>Активные потребности ({shelter.needs.length})</h2>
      <NeedGrid needs={shelter.needs} />
    </section>
  );
}