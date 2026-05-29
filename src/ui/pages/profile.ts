import type { PageResult } from '../router';

export async function ProfilePage(): Promise<PageResult> {
  return {
    html: `
      <section>
        <h2>Profile</h2>
        <p>Coming soon.</p>
      </section>`,
  };
}
