import { useState } from 'react';
import { fetchNeeds } from '../api/client.js';
import { useAsync } from '../api/useAsync.js';
import { NeedGrid, NeedError } from '../features/needs/NeedCard.js';
import { CATEGORY_LABELS } from '../api/types.js';
import styles from '../features/needs/Filters.module.css';

const CITIES = ['Москва', 'Омск'];
const PAGE_SIZE = 6;

export function NeedsPage(): JSX.Element {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useAsync(
    (signal) =>
      fetchNeeds(
        {
          city: city || undefined,
          category: category || undefined,
          priority: priority || undefined,
          q: query.trim() || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
        signal
      ),
    [city, category, priority, query, page]
  );

  const reset = (): void => {
    setCity('');
    setCategory('');
    setPriority('');
    setQuery('');
    setPage(0);
  };

  const hasFilters = Boolean(city || category || priority || query.trim());
  const total = data?.total ?? 0;
  const shown = data?.items.length ?? 0;
  const canPrev = page > 0;
  const canNext = page * PAGE_SIZE + shown < total;

  return (
    <section>
      <h1>Потребности приютов</h1>
      <p className={styles.summary}>
        Выберите, чем вы можете помочь прямо сейчас. Регистрация не нужна.
      </p>

      <div className={styles.bar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="f-city">Город</label>
          <select
            id="f-city"
            className={styles.select}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Все города</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="f-cat">Категория</label>
          <select
            id="f-cat"
            className={styles.select}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Все категории</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="f-prio">Приоритет</label>
          <select
            id="f-prio"
            className={styles.select}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Любой</option>
            <option value="urgent">Только срочные</option>
            <option value="normal">Обычные</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="f-q">Поиск</label>
          <input
            id="f-q"
            className={styles.input}
            type="search"
            placeholder="корм, пелёнки, приют..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <button type="button" className={styles.reset} onClick={reset} disabled={!hasFilters}>
          Сбросить
        </button>
      </div>

      {error && <NeedError message={error} />}

      {loading && <p className={styles.summary}>Загрузка…</p>}

      {!loading && !error && (
        <>
          <p className={styles.summary}>
            Найдено потребностей: <strong>{total}</strong>
            {shown > 0 && ` (показано ${shown})`}
          </p>
          <NeedGrid needs={data?.items ?? []} />

          {total > PAGE_SIZE && (
            <div className={styles.pager}>
              <button type="button" onClick={() => setPage((p) => p - 1)} disabled={!canPrev}>
                Назад
              </button>
              <span>
                Страница {page + 1} из {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}