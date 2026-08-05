import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — Kids Day" },
      {
        name: "description",
        content:
          "Политика конфиденциальности приложения Kids Day. Мы не используем аналитику, трекинг и рекламу.",
      },
      { property: "og:title", content: "Политика конфиденциальности — Kids Day" },
      {
        property: "og:description",
        content:
          "Политика конфиденциальности приложения Kids Day. Мы не используем аналитику, трекинг и рекламу.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const SUPPORT_EMAIL = "support@kidsday.app";

function PrivacyPage() {
  return (
    <div className="px-5 py-6 pb-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>

      <article className="mt-4 space-y-6 text-sm leading-relaxed">
        <header>
          <h1 className="text-2xl font-extrabold">Политика конфиденциальности Kids Day</h1>
          <p className="mt-1 text-muted-foreground">Дата вступления в силу: 5 августа 2026 г.</p>
        </header>

        <p>
          Kids Day — семейное приложение для трекинга ежедневных задач детей. Мы не используем
          аналитику, трекинг и рекламу.
        </p>

        <section>
          <h2 className="text-lg font-extrabold">Какие данные мы собираем</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">
            <li>
              <strong>От родителя:</strong> email и имя (при регистрации через email или Google).
            </li>
            <li>
              <strong>О ребёнке:</strong> имя, эмодзи-аватар и PIN-код для входа — указывает
              родитель.
            </li>
            <li>
              <strong>Данные об использовании:</strong> список заданий, отметки о выполнении,
              накопленные монеты, история покупок наград.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Как мы используем данные</h2>
          <p className="mt-2">
            Исключительно для работы приложения — отображения заданий, начисления монет,
            синхронизации между устройствами родителя и ребёнка. Данные не передаются третьим лицам
            и не используются в рекламных целях.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Хранение данных</h2>
          <p className="mt-2">
            Данные хранятся на серверах Supabase с ограничением доступа на уровне базы данных (Row
            Level Security) — доступ к данным ребёнка есть только у его родителя.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Права пользователя</h2>
          <p className="mt-2">
            Родитель может удалить профиль ребёнка и все связанные с ним данные в любой момент через
            панель родителя в приложении. Для полного удаления аккаунта родителя — напишите на{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-bold text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Дети</h2>
          <p className="mt-2">
            Аккаунты детей создаются и управляются родителем. Мы не собираем данные напрямую от
            детей и не запрашиваем у них никакой личной информации сверх имени и аватара, указанных
            родителем.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold">Контакты</h2>
          <p className="mt-2">
            По вопросам, связанным с обработкой данных, пишите на{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-bold text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-lg font-extrabold">Privacy Policy (English summary)</h2>
          <p className="mt-2">
            Kids Day is a family task-tracking app. We do not use analytics, tracking, or
            advertising. We collect: parent email/name (via email or Google sign-in), a kid&apos;s
            name/avatar/PIN as set by the parent, and task/reward activity data. Data is stored on
            Supabase with row-level access control — only a kid&apos;s own parent can access their
            data. Data is used solely to operate the app and is never sold or shared with third
            parties. Parents can delete a kid&apos;s profile and data anytime from the parent
            dashboard. Contact:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-bold text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
