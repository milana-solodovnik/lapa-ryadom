/// <reference types="vitest" />
// Integration tests share the development database. Test files cannot run in
// parallel because they each `DELETE FROM offers WHERE need_id = $1` for the
// same rows and trips over `deliveries_offer_id_fkey`. Force the "forks"
// pool with singleFork so each file gets its own worker sequentially.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
  },
});
