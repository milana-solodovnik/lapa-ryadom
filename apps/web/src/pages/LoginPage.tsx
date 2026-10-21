import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, login as apiLogin, logout as apiLogout } from '../api/client.js';
import styles from './Login.module.css';

interface AuthState {
  loading: boolean;
  error: string | null;
  goto: string | null; // null = stay on this page; otherwise react-router Navigate target
}

export function LoginPage(): JSX.Element {
  const nav = useNavigate();
  const [username, setUsername] = useState('rep_a');
  const [password, setPassword] = useState('dev-rep-a-pwd-123');
  const [state, setState] = useState<AuthState>({ loading: false, error: null, goto: null });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true, error: null, goto: null });
    try {
      await apiLogin({ username, password });
      setState({ loading: false, error: null, goto: '/shelter/receive' });
    } catch (err) {
      setState({
        loading: false,
        error:
          err instanceof ApiError
            ? err.message
            : 'Не удалось войти. Проверьте логин и пароль.',
        goto: null,
      });
    }
  }

  async function onLogout() {
    try {
      await apiLogout();
    } finally {
      setState({ loading: false, error: null, goto: '/' });
    }
  }

  if (state.goto) {
    return <Navigate to={state.goto} replace />;
  }

  return (
    <section className={styles.page}>
      <header>
        <h1>Вход для представителя приюта</h1>
        <p>
          Эта страница открывается только когда нужно подтвердить физическую передачу
          помощи (шаг D2 сценария). Дарители могут оставлять заявки без входа.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className={styles.form}
        aria-busy={state.loading}
      >
        <label>
          <span>Логин</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            required
            disabled={state.loading}
          />
        </label>
        <label>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
            disabled={state.loading}
          />
        </label>
        {state.error && <p className={styles.error}>{state.error}</p>}
        <div className={styles.actions}>
          <button type="submit" disabled={state.loading}>
            {state.loading ? 'Входим…' : 'Войти'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={styles.secondary}
          >
            Выйти (если уже вошёл)
          </button>
        </div>
        <details>
          <summary>Что подставляется в полях по умолчанию?</summary>
          <p>
            Учётки и пароли приходят из <code>db/seed/data.mjs</code> и переменных
            окружения <code>DEMO_REP_*_PASSWORD</code>. Демо-пароль
            <code> dev-rep-a-pwd-123 </code>, его можно поменять через <code>.env</code>.
            В рабочей версии сюда вели бы cookie-сессию автоматически — сейчас срок
            8 часов, как задаёт <code>SESSION_TTL_HOURS</code>.
          </p>
        </details>
      </form>
    </section>
  );
}
