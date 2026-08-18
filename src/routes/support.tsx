import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Поддержка — Kids Day" },
      {
        name: "description",
        content:
          "Свяжитесь с поддержкой Kids Day по любым вопросам, багам или помощи с приложением.",
      },
      { property: "og:title", content: "Поддержка — Kids Day" },
      {
        property: "og:description",
        content:
          "Свяжитесь с поддержкой Kids Day по любым вопросам, багам или помощи с приложением.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const SUPPORT_EMAIL = "sharapieva@gmail.com";

function SupportPage() {
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
          <h1 className="text-2xl font-extrabold">Поддержка Kids Day</h1>
        </header>

        <p>
          Есть вопрос, нашли баг или нужна помощь с приложением? Напишите — ответим как можно
          быстрее.
        </p>

        <p>
          Email:{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-bold text-primary underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>

        <section>
          <h2 className="text-lg font-extrabold">Частые вопросы</h2>
          <dl className="mt-3 space-y-4">
            <div>
              <dt className="font-bold">Как восстановить PIN ребёнка?</dt>
              <dd className="mt-1 text-muted-foreground">
                На панели родителя, во вкладке «Семья», рядом с профилем ребёнка есть значок
                обновления — он сгенерирует новый PIN.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Как удалить профиль ребёнка?</dt>
              <dd className="mt-1 text-muted-foreground">
                На панели родителя, во вкладке «Семья», рядом с профилем ребёнка есть значок
                корзины.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Как удалить аккаунт полностью?</dt>
              <dd className="mt-1 text-muted-foreground">
                Это можно сделать прямо в приложении: Панель родителя → внизу → «Удалить аккаунт».
                Это необратимо и удалит все данные семьи. Если кнопка не работает, напишите на{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-bold text-primary underline underline-offset-2"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                — поможем вручную.
              </dd>
            </div>
          </dl>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-lg font-extrabold">Support (English)</h2>
          <p className="mt-2">
            Have a question or found a bug? Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-bold text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and we&apos;ll get back to you.
          </p>
        </section>
      </article>
    </div>
  );
}
