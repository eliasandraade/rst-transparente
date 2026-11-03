import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = { title: { absolute: "Página não encontrada — Orken COND" }, robots: { index: false } };

/** 404 neutro: condomínio inexistente, desativado ou página que não existe respondem igual. */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="titulo">
          <h1 id="titulo" className={styles.title}>
            Página não encontrada
          </h1>
          <p className={styles.lede}>
            Confira o endereço. O portal de cada condomínio fica em{" "}
            <span className={styles.address}>cond.orken.com.br/seu-condominio</span>.
          </p>
          <Link className={styles.link} href="/">
            Orken COND
          </Link>
        </section>
      </main>
    </div>
  );
}
