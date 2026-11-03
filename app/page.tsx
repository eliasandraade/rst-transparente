import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Orken COND — gestão e transparência condominial" },
  description:
    "Portal de cada condomínio com finanças publicadas, demandas com protocolo, avisos, enquetes, obras e jurídico, e a gestão com acesso pela conta Orken.",
};

const MODULOS = ["Financeiro", "Demandas", "Avisos", "Enquetes", "Obras", "Propostas", "Jurídico", "Conselho Fiscal"];

/**
 * Raiz do produto: diz o que é o Orken COND e por onde entrar. Não lista nem
 * revela condomínios; cada um divulga o próprio endereço aos moradores.
 */
export default function ProductPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="https://www.orken.com.br" aria-label="Orken">
          {/* eslint-disable-next-line @next/next/no-img-element -- wordmark oficial em PNG */}
          <img className={styles.wordmark} src="/brand/orken-wordmark.png" alt="Orken" width={250} height={84} />
          {/* eslint-disable-next-line @next/next/no-img-element -- wordmark oficial em PNG */}
          <img className={`${styles.wordmark} ${styles.wordmarkDark}`} src="/brand/orken-wordmark-dark.png" alt="" width={250} height={85} />
        </a>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="titulo">
          <h1 id="titulo" className={styles.title}>
            Orken <span className={styles.suffix}>COND</span>
          </h1>
          <p className={styles.lede}>
            Gestão, transparência e relacionamento condominial. Cada condomínio tem o seu portal: contas publicadas pelo
            conselho, demandas com protocolo, avisos e enquetes para os moradores, e a gestão no mesmo lugar.
          </p>
          <ul className={styles.modules} aria-label="Módulos">
            {MODULOS.map((modulo) => (
              <li key={modulo}>{modulo}</li>
            ))}
          </ul>
        </section>

        <div className={styles.paths}>
          <section className={styles.path} aria-labelledby="moradores">
            <h2 id="moradores" className={styles.pathTitle}>
              Moradores
            </h2>
            <p className={styles.pathText}>
              Use o endereço que o seu condomínio divulgou, no formato{" "}
              <span className={styles.address}>cond.orken.com.br/seu-condominio</span>. Consultar as contas, registrar
              uma demanda e votar em enquetes não exige conta.
            </p>
          </section>
          <section className={styles.path} aria-labelledby="gestao">
            <h2 id="gestao" className={styles.pathTitle}>
              Síndicos, conselho e administração
            </h2>
            <p className={styles.pathText}>
              A gestão entra pelo portal do próprio condomínio ou pela Minha Orken, com a conta Orken da organização.
            </p>
            <a className={styles.link} href="https://app.orken.com.br">
              Entrar na Minha Orken
            </a>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>Orken COND · Andrade Systems</footer>
    </div>
  );
}
