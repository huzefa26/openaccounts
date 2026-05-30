import type { PageResult } from '../router';

export async function ProfilePage(): Promise<PageResult> {
  return {
    html: `
      <section>
        <p>Coming soon.</p>
      </section>`,
  };
}
