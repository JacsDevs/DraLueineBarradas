import FAQSection from "../components/FAQSection";
import imagem1 from "../assets/imagem1.jpg"
import dralueinebarradas from "../assets/dralueinebarradas.webp"
import DraLueine from "../assets/lueine-barradas.webp"
import BlogSection from "../components/BlogSection"
import TestimonialsSection from "../components/TestimonialsSection";
import EnvironmentSection from "../components/EnvironmentSection";
import { IoLocationSharp, IoTimeOutline, IoLocationOutline } from "react-icons/io5";
import WhatsAppButton from "../components/WhatsAppButton";
import { Helmet } from "react-helmet-async";


export default function Home(){
  return(
    <main>

      <Helmet>
        <title>Dra. Lueine Barradas | Médica Cardiologista em Bragança - Pará</title>
        <meta name="description" content="Atendimento médico humanizado em Bragança, PA. Especialista em saúde cardiovascular, check-ups e prevenção. Agende sua consulta com a Dra. Lueine Barradas."/>
        <meta name="keywords" content="Cardiologista Bragança PA, Médica Bragança Pará, Check-up cardiológico, Hipertensão, Dra Lueine Barradas" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Dra. Lueine Barradas",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Av. Nazeazeno Ferreira, 60",
                "addressLocality": "Bragança",
                "addressRegion": "PA",
                "addressCountry": "BR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -1.0488685, 
                "longitude": -46.7686801
              },
              "telephone": "+5591985807373"
            }
          `}
        </script>
      </Helmet>

      <section id="inicio" className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-container">

          {/* TEXTO */}
          <div className="hero-text">
            <span className="hero-label">DRA. LUEINE BARRADAS</span>

            <h1>
              CUIDADO E <br />
              <span>COMPROMISSO</span>
            </h1>

            <p>
              Meu propósito como médica é alinhar o cuidado humanizado e a excelência técnica para garantir saúde e qualidade de vida para você.
            </p>

            <div className="hero-actions">
              <div className="hero-location">
                <IoLocationSharp size={16} color="#FFF" />
                <span>Atendimento em Bragança - PA</span>
              </div>
              <div>
                <WhatsAppButton
                  className="hero-btn primary"
                />
              </div>
            </div>
          </div>

          {/* IMAGEM */}
          <div className="hero-image">
            <img
              src={dralueinebarradas}
              alt="Dra. Lueine Barradas - Médica Cardiologista em Bragança Pará"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          <aside className="hero-card">
              <strong>Dra. Lueine Barradas</strong>
              <p>CRM PA 18364</p>

              <ul>
                <li><b>Área de atuação:</b> Cardiologia</li>
                <li><b>Foco:</b> Prevenção e cuidado integral</li>
                <li><b>Experiência:</b> Atendimento clínico humanizado</li>
              </ul>
            </aside>

        </div>

        <div className="hero-scroll">⌄</div>
      </section>

      <section id="servicos">

        <header className="section-header">
          <span className="label">SERVIÇOS</span>
          <h2>O que eu posso te ajudar?</h2>
        </header>

        <div className="cards-grid">
          <article className="card">
            <h3>Consulta de rotina</h3>
            <p>
              Atendimento clínico integral, com foco na prevenção, no acompanhamento contínuo
              e no cuidado individualizado em todas as fases da vida.
            </p>
          </article>

          <article className="card">
            <h3>Check-up Cardiológico</h3>
            <p>
              Avaliação completa da saúde cardiovascular, com análise de fatores de risco,
              histórico clínico e solicitação de exames conforme indicação individual.
            </p>
          </article>

          <article className="card">
            <h3>Avaliação e Liberação para Atividade Física</h3>
            <p>
              Avaliação clínica e cardiovascular para liberação segura da prática de atividade
              física, considerando idade, histórico de saúde e exames complementares.
            </p>
          </article>

          <article className="card">
            <h3>Consultas Pré-operatórias</h3>
            <p>
              Avaliação clínica e cardiovascular para liberação cirúrgica, com estratificação
              de risco e orientações pré e pós-operatórias.
            </p>
          </article>

          <article className="card">
            <h3>Prevenção de Doenças Cardiovasculares</h3>
            <p>
              Acompanhamento direcionado à redução de risco cardiovascular, com controle de
              hipertensão, diabetes, colesterol, obesidade e hábitos de vida.
            </p>
          </article>

          <article className="card">
            <h3>Hipertensão Arterial</h3>
            <p>
              Diagnóstico, acompanhamento e controle da pressão arterial, com plano terapêutico
              individualizado e monitoramento contínuo.
            </p>
          </article>

          <article className="card">
            <h3>Doença Arterial Coronariana</h3>
            <p>
              Avaliação e acompanhamento clínico de pacientes com doença arterial coronariana,
              com foco em controle de fatores de risco e prevenção de eventos.
            </p>
          </article>

          <article className="card">
            <h3>Infarto Agudo do Miocárdio</h3>
            <p>
              Seguimento clínico e prevenção secundária em pacientes com histórico de infarto,
              com foco em segurança, controle de risco e qualidade de vida.
            </p>
          </article>

          <article className="card">
            <h3>Insuficiência Cardíaca</h3>
            <p>
              Acompanhamento clínico de pacientes com insuficiência cardíaca,
              com orientação terapêutica, controle de sintomas e monitoramento contínuo.
            </p>
          </article>

          <article className="card">
            <h3>Arritmias Cardíacas</h3>
            <p>
              Avaliação clínica de alterações do ritmo cardíaco, com investigação,
              acompanhamento e orientação conforme cada caso.
            </p>
          </article>

          <article className="card">
            <h3>Obesidade e Síndrome Metabólica</h3>
            <p>
              Abordagem clínica integrada para obesidade e síndrome metabólica, 
              com foco em saúde, mudança de hábitos e acompanhamento contínuo.
            </p>
          </article>

          <article className="card">
            <h3>Colesterol e Triglicerídeos Elevados</h3>
            <p>
              Avaliação e controle das dislipidemias, com orientação 
              individualizada e prevenção de doenças cardiovasculares.
            </p>
          </article>

          <article className="card">
            <h3>Diabetes Mellitus</h3>
            <p>
              Acompanhamento clínico do diabetes, com foco no controle glicêmico, 
              prevenção de complicações e promoção da saúde.
            </p>
          </article>

          <article className="card">
            <h3>Avaliação do Sono e Apneia do Sono</h3>
            <p>
              Avaliação clínica do sono e acompanhamento de pacientes com suspeita ou diagnóstico de apneia do sono.
            </p>
          </article>

          <article className="card">
            <h3>Tratamento do Tabagismo</h3>
            <p>
              Acompanhamento médico para cessação do tabagismo, com estratégias
              individualizadas e foco na redução de riscos à saúde.
            </p>
          </article>
        </div>
      </section>

      <section id="consulta" className="procedure-section">

        <header className="section-header">
          <span className="label">CUIDADO INTEGRAL</span>
          <h2 className="procedure-title">O que acontece na consulta?</h2>
        </header>

        <article className="procedure-step reverse">

          {/* TEXTO */}
          <div className="procedure-content">
            <p className="procedure-description">
              A consulta começa com uma investigação detalhada da sua saúde, buscando compreender você de forma integral. 
              Avalio aspectos clínicos, hábitos de vida e fatores que podem impactar diretamente sua saúde, especialmente a saúde cardiovascular.
            </p>
            <p className="procedure-description">Durante esse primeiro momento, conversamos sobre:</p>

            <ul className="procedure-list" role="list">
              <li>Histórico de doenças, cirurgias, alergias e uso de medicamentos</li>
              <li>Hábitos de vida e rotina diária</li>
              <li>Padrão de sono, qualidade do descanso e presença de roncos</li>
              <li>Nível de atividade física e sedentarismo</li>
              <li>Saúde emocional, incluindo sintomas de ansiedade e depressão</li>
              <li>Outros fatores que possam influenciar sua saúde cardiovascular e metabólica</li>
            </ul>
          </div>

          {/* IMAGEM */}
          <div className="procedure-image">
            <img src={imagem1} alt="Consulta médica com avaliação cardiovascular"/>
          </div>

        </article>

        <article className="procedure-step">

          {/* IMAGEM */}
          <div className="procedure-image">
            <img src={imagem1} />
          </div>

          {/* TEXTO */}
          <div className="procedure-content">
            <p className="procedure-description">
              Na sequência, realizo um exame físico completo, com atenção especial ao sistema cardiovascular, avaliando sinais importantes para um acompanhamento seguro e individualizado.
            </p>

            <p className="procedure-description">
              Com base nas diretrizes médicas mais atualizadas, também oriento sobre vacinas e exames preventivos essenciais, sempre considerando idade, sexo, histórico pessoal e familiar, como:
            </p>

            <ul className="procedure-list" role="list">
              <li>Colonoscopia</li>
              <li>Densitometria óssea</li>
              <li>Avaliações urológicas ou ginecológicas</li>
              <li>Exames específicos para a saúde cardiovascular</li>
            </ul>
          </div>

        </article>

        <aside className="procedure-highlight">
          <p>
            O objetivo da consulta é oferecer um cuidado personalizado e preventivo,
            ajudando você a compreender melhor sua saúde, reduzir riscos e promover
            longevidade com qualidade de vida, sempre alinhando excelência técnica
            com um olhar atento às suas necessidades individuais.
          </p>
        </aside>
      </section>

      <section id="sobre" className="about">
        <div className="about-container">

          {/* IMAGEM */}
          <div className="about-image">
            <img src={DraLueine} alt="Dra. Lueine Barradas" />
          </div>

          {/* TEXTO */}
          <div className="about-content">

            <header className="section-header">
              <span className="label">SOBRE MIM</span>
              <h2>Conheça a <br /> Dra. Lueine Barradas</h2>
            </header>

            <div className="about-crm">
              CRM PA 18364
            </div>

            <div className="about-image-mobile">
              <img src={DraLueine} alt="Dra. Lueine Barradas" />
            </div>

            <p>
              Médica formada pela Universidade do Vale do Itajaí (UNIVALI), com atuação em Medicina de Família e Comunidade e foco em medicina preventiva e cuidado integral à saúde.
            </p>

            <p>
              Atua em Bragança – Pará, acompanhando pacientes de forma individualizada, com um olhar atento não apenas para a doença, mas para a pessoa como um todo.
            </p>

            <p>
              Acredita que cuidar da saúde vai além de tratar sintomas. Por isso, mantém atualização contínua e atualmente realiza pós-graduação em Cardiologia e Imunização Humana, integrando prevenção, diagnóstico e acompanhamento ao longo do tempo.
            </p>

            <p>
              Seu trabalho é baseado na escuta qualificada, na construção de vínculo e na elaboração de planos de cuidado que façam sentido para a realidade de cada paciente.
            </p>
            <WhatsAppButton
              className="about-button"
            />

          </div>

        </div>
      </section>

      <TestimonialsSection/>

      <FAQSection/>

      <BlogSection/>

      <EnvironmentSection/>

      <section id="contato" className="contact">

        <header className="section-header">
          <span className="label">CONTATO</span>
          <h2>Entre em contato conosco</h2>
        </header>

        <div className="map-wrapper">
          <iframe
            title="Mapa consultório"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.1498290488926!2d-46.77125592417375!3d-1.0488539354144943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x92aed980f8c377f7%3A0x14025d174ba7fb3!2sDra%20Lueine%20Barradas!5e0!3m2!1spt-BR!2sbr!4v1768520805311!5m2!1spt-BR!2sbr"
            loading="lazy">
          </iframe>

          {/* Wrapper dos cards */}
          <div className="contact-cards">
            <div className="contact-card">
              <IoTimeOutline size={28} />
              <div>
                <strong>Segunda a Sexta</strong>
                <p>08h até às 18h</p>
              </div>
            </div>

            <div className="contact-card">
              <IoLocationOutline size={28} />
              <div>
                <strong>Endereço</strong>
                <p>
                  Av. Nazeazeno Ferreira, 60 - Padre Luiz, Bragança - PA
                </p>
              </div>
            </div>
          </div>

          <a href="#" className="contact-button">
            Agendar Avaliação →
          </a>
        </div>
      </section>

    </main>
  )
}
