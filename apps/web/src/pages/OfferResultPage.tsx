import { Link, useLocation } from 'react-router-dom';

interface OfferState {
  code: string;
  quantity: number;
  needTitle: string;
  expiresAt: string;
}

export function OfferResultPage(): JSX.Element {
  const location = useLocation();
  const state = (location.state ?? null) as OfferState | null;

  if (!state || !state.code) {
    return (
      <section>
        <h1>Код предложения</h1>
        <p>
          Здесь появляется код после отправки заявки.{' '}
          <Link to="/needs">Вернуться к каталогу</Link>.
        </p>
      </section>
    );
  }

  const expires = new Date(state.expiresAt);

  return (
    <section>
      <h1>Спасибо! Вот ваш код</h1>
      <p>
        Вы предложили <strong>{state.quantity}</strong> для потребности «{state.needTitle}».
      </p>

      <div className="code-panel">
        <div className="code-value">{state.code}</div>
        <p className="code-note">
          Код показывается один раз и в базе не хранится — только его хеш. Сохраните его сейчас.
        </p>
      </div>

      <h2>Что дальше</h2>
      <ol className="steps">
        <li>Привезите помощь в приют в часы приёма.</li>
        <li>Назовите этот код сотруднику приюта.</li>
        <li>Сотрудник введёт код и укажет, сколько он реально принял.</li>
      </ol>

      <p className="offer-hint">
        Резерв действует до {expires.toLocaleDateString('ru-RU')}. Если вы не успеете привезти,
        количество вернётся в свободный остаток автоматически.
      </p>

      <p>
        <Link to="/needs">← К другим потребностям</Link>
      </p>
    </section>
  );
}