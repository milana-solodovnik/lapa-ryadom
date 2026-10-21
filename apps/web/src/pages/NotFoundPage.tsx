import { Link } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return (
    <section>
      <h1>Страница не найдена</h1>
      <p>
        Вернуться к <Link to="/needs">каталогу потребностей</Link>.
      </p>
    </section>
  );
}
