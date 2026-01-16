import FAQSection from "../components/FAQSection";
import imagem1 from "../assets/imagem1.jpg"
import medica from "../assets/medica.png"
import DraLueine from "../assets/lueine-barradas.webp"
import BlogSection from "../components/BlogSection"

export default function Home(){
  return(
    <main>

      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-container">

          {/* TEXTO */}
          <div className="hero-text">
            <span className="hero-label">CIRURGIA ESPECIALIZADA</span>

            <h1>
              CUIDADO E <br />
              <span>COMPROMISSO</span>
            </h1>

            <p>
              Meu propósito como médica é alinhar o cuidado humanizado e a excelência técnica para garantir saúde e qualidade de vida para você.
            </p>

            <div className="hero-actions">
              <div>
                <span className="hero-location">📍 Atendimento em Bragança/PA</span>
              </div>
              <div>
                <a href="#" className="hero-btn primary">
                  Fale pelo WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* IMAGEM */}
          <div className="hero-image">
            <img
              src={medica}
              alt="Dra Lueine Barradas"
            />
          </div>

          <div className="hero-card">
              <strong>Dra. Lueine Barradas</strong>
              <p>CRM PA 18364</p>

              <ul>
                <li><b>Especialidade:</b> Cardiologia</li>
                <li><b>Foco:</b> Prevenção e cuidado integral</li>
                <li><b>Experiência:</b> Atendimento clínico humanizado</li>
              </ul>
            </div>

        </div>

        <div className="hero-scroll">⌄</div>
      </section>

      <section>
      <h2>O que eu posso te ajudar?</h2>

      <div className="cards-grid">
        <div className="card">
          <h3>Consulta de rotina</h3>
          <p>
            Atendimento clínico integral, com foco na prevenção, no acompanhamento contínuo
            e no cuidado individualizado em todas as fases da vida.
          </p>
        </div>

        <div className="card">
          <h3>Check-up Cardiológico</h3>
          <p>
            Avaliação completa da saúde cardiovascular, com análise de fatores de risco,
            histórico clínico e solicitação de exames conforme indicação individual.
          </p>
        </div>

        <div className="card">
          <h3>Avaliação e Liberação para Atividade Física</h3>
          <p>
            Avaliação clínica e cardiovascular para liberação segura da prática de atividade
            física, considerando idade, histórico de saúde e exames complementares.
          </p>
        </div>

        <div className="card">
          <h3>Consultas Pré-operatórias</h3>
          <p>
            Avaliação clínica e cardiovascular para liberação cirúrgica, com estratificação
            de risco e orientações pré e pós-operatórias.
          </p>
        </div>

        <div className="card">
          <h3>Prevenção de Doenças Cardiovasculares</h3>
          <p>
            Acompanhamento direcionado à redução de risco cardiovascular, com controle de
            hipertensão, diabetes, colesterol, obesidade e hábitos de vida.
          </p>
        </div>

        <div className="card">
          <h3>Hipertensão Arterial</h3>
          <p>
            Diagnóstico, acompanhamento e controle da pressão arterial, com plano terapêutico
            individualizado e monitoramento contínuo.
          </p>
        </div>

        <div className="card">
          <h3>Doença Arterial Coronariana</h3>
          <p>
            Avaliação e acompanhamento clínico de pacientes com doença arterial coronariana,
            com foco em controle de fatores de risco e prevenção de eventos.
          </p>
        </div>

        <div className="card">
          <h3>Infarto Agudo do Miocárdio</h3>
          <p>
            Seguimento clínico e prevenção secundária em pacientes com histórico de infarto,
            com foco em segurança, controle de risco e qualidade de vida.
          </p>
        </div>

        <div className="card">
          <h3>Insuficiência Cardíaca</h3>
          <p>
            Acompanhamento clínico de pacientes com insuficiência cardíaca,
            com orientação terapêutica, controle de sintomas e monitoramento contínuo.
          </p>
        </div>

        <div className="card">
          <h3>Arritmias Cardíacas</h3>
          <p>
            Avaliação clínica de alterações do ritmo cardíaco, com investigação,
            acompanhamento e orientação conforme cada caso.
          </p>
        </div>

        <div className="card">
          <h3>Obesidade e Síndrome Metabólica</h3>
          <p>
            Abordagem clínica integrada para obesidade e síndrome metabólica, 
            com foco em saúde, mudança de hábitos e acompanhamento contínuo.
          </p>
        </div>

        <div className="card">
          <h3>Colesterol e Triglicerídeos Elevados</h3>
          <p>
            Avaliação e controle das dislipidemias, com orientação 
            individualizada e prevenção de doenças cardiovasculares.
          </p>
        </div>

        <div className="card">
          <h3>Diabetes Mellitus</h3>
          <p>
            Acompanhamento clínico do diabetes, com foco no controle glicêmico, 
            prevenção de complicações e promoção da saúde.
          </p>
        </div>

        <div className="card">
          <h3>Avaliação do Sono e Apneia do Sono</h3>
          <p>
            Avaliação clínica do sono e acompanhamento de pacientes com suspeita ou diagnóstico de apneia do sono.
          </p>
        </div>

        <div className="card">
          <h3>Tratamento do Tabagismo</h3>
          <p>
            Acompanhamento médico para cessação do tabagismo, com estratégias
            individualizadas e foco na redução de riscos à saúde.
          </p>
        </div>
      </div>
    </section>

      <section className="procedure-section">
        <h2 className="procedure-title">O que acontece na consulta?</h2>

        <div className="procedure-container">

          {/* TEXTO */}
          <div className="procedure-content">
            <p className="procedure-description">
              A consulta começa com uma investigação detalhada da sua saúde, buscando compreender você de forma integral. 
              Avalio aspectos clínicos, hábitos de vida e fatores que podem impactar diretamente sua saúde, especialmente a saúde cardiovascular.
            </p>
            <p className="procedure-description">Durante esse primeiro momento, conversamos sobre:</p>

            <ul className="procedure-list">
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
            <img src={imagem1} />
          </div>

        </div>

        <div className="procedure-container">

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

            <ul className="procedure-list">
              <li>Colonoscopia</li>
              <li>Densitometria óssea</li>
              <li>Avaliações urológicas ou ginecológicas</li>
              <li>Exames específicos para a saúde cardiovascular</li>
            </ul>
          </div>

        </div>

        <div className="procedure-highlight">
          <p>
            O objetivo da consulta é oferecer um cuidado personalizado e preventivo,
            ajudando você a compreender melhor sua saúde, reduzir riscos e promover
            longevidade com qualidade de vida, sempre alinhando excelência técnica
            com um olhar atento às suas necessidades individuais.
          </p>
        </div>
      </section>

      <section className="about">
        <div className="about-container">

          {/* IMAGEM */}
          <div className="about-image">
            <img src={DraLueine} alt="Dra. Lueine Barradas" />
          </div>

          {/* TEXTO */}
          <div className="about-content">
            <span className="about-label">SOBRE MIM</span>

            <h2>Conheça a <br /> Dra. Lueine Barradas</h2>

            <div className="about-crm">
              CRM PA 18364
            </div>

            <p>
              Médica formada pela Universidade do Vale do Itajaí (UNIVALI), com atuação em Medicina de Família e Comunidade e foco em medicina preventiva e cuidado integral à saúde.
            </p>

            <p>
              Atua em Bragança – Pará, acompanhando pacientes de forma individualizada, com um olhar atento não apenas para a doença, mas para a pessoa como um todo.
            </p>

            <p>
              Acredita que cuidar da saúde vai além de tratar sintomas. Por isso, mantém atualização contínua e atualmente realiza pós-graduação em Cardiologia e Vacinação Humana, integrando prevenção, diagnóstico e acompanhamento ao longo do tempo.
            </p>

            <p>
              Seu trabalho é baseado na escuta qualificada, na construção de vínculo e na elaboração de planos de cuidado que façam sentido para a realidade de cada paciente.
            </p>

            <a href="#" className="about-button">
              Fale pelo WhatsApp
            </a>
          </div>

        </div>
      </section>

      <section className="testimonials">
        <span className="testimonials-label">DEPOIMENTOS</span>
        <h2>O que nossos pacientes dizem sobre nosso trabalho?</h2>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar"></div>
              <div>
                <strong>Paciente XXX</strong>
                <div className="stars">★★★★★</div>
              </div>
            </div>
            <p>
              Atendimento extremamente atencioso e humanizado.
              Me senti acolhida desde o início da consulta e
              todas as dúvidas foram esclarecidas com calma.
            </p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar"></div>
              <div>
                <strong>Paciente XXX</strong>
                <div className="stars">★★★★★</div>
              </div>
            </div>
            <p>
              Profissional excelente, muito cuidadosa e detalhista.
              A consulta foi completa e me trouxe muita segurança
              em relação ao meu tratamento.
            </p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar"></div>
              <div>
                <strong>Paciente XXX</strong>
                <div className="stars">★★★★★</div>
              </div>
            </div>
            <p>
              Atendimento diferenciado, com foco na prevenção
              e no cuidado individual. Recomendo com total
              confiança.
            </p>
          </div>
        </div>

        <a href="#" className="testimonial-button">
          Escrever Avaliação →
        </a>
      </section>
      
      <FAQSection/>

      <BlogSection/>

      <section className="contact">
        <span className="contact-label">CONTATO</span>
        <h2>Entre em contato conosco</h2>

        <div className="map-wrapper">
          <iframe
            title="Mapa consultório"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.1498290488926!2d-46.77125592417375!3d-1.0488539354144943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x92aed980f8c377f7%3A0x14025d174ba7fb3!2sDra%20Lueine%20Barradas!5e0!3m2!1spt-BR!2sbr!4v1768520805311!5m2!1spt-BR!2sbr"
            loading="lazy">
          </iframe>

          {/* Wrapper dos cards */}
          <div className="contact-cards">
            <div className="contact-card">
              <span className="icon">🕒</span>
              <div>
                <strong>Segunda a Sexta</strong>
                <p>08h até às 18h</p>
              </div>
            </div>

            <div className="contact-card">
              <span className="icon">📍</span>
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
