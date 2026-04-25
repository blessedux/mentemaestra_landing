export type Locale = "es" | "en";

export const messages = {
  es: {
    nav: {
      design: "Diseño",
      services: "Servicios",
      works: "Proyectos",
      experience: "Experiencia",
      book: "Agenda",
      pricing: "Precios",
      faq: "FAQ",
      cta: "Iniciar proyecto",
      speakToHuman: "Habla con un humano ahora",
      portalLogin: "Acceso al portal",
    },
    portalRecover: {
      metaTitle: "Acceso al portal — MenteMaestra",
      metaDescription:
        "Recupera el enlace de tu espacio de proyecto con tu correo autorizado.",
      title: "Acceso al portal",
      subtitle:
        "Si olvidaste el enlace de tu proyecto, ingresa el correo con el que te dieron acceso. Si está en la lista autorizada, te enviaremos un enlace seguro.",
      emailLabel: "Correo con acceso al portal",
      emailPlaceholder: "tu@empresa.com",
      hint: "Debe ser el mismo correo que figura en la lista autorizada del proyecto. Si participas en varios proyectos, puede que recibas más de un correo.",
      submit: "Enviar enlace mágico",
      sending: "Enviando…",
      success:
        "Si tu correo está autorizado en algún proyecto, te enviamos un enlace en unos minutos. Revisa la bandeja y el spam.",
      error: "No pudimos completar la solicitud. Inténtalo más tarde.",
      backHome: "← Volver al inicio",
    },
    about: {
      sectionTitle: "Nosotros",
      introTitle: "El partner creativo para empresas en crecimiento.",
      introTitleSecondary: "Diseño senior, sin contratar un equipo interno",
      introDescription:
        "Somos un estudio digital con base en Santiago, Chile. Diseñamos marcas, sitios web y experiencias digitales con enfoque premium: claridad visual, ejecución elegante y detalle estratégico para que tu negocio proyecte confianza y valor en cada punto de contacto.",
      introDescriptionSecondary:
        "Webs, apps, branding y contenido gráfico entregado con rapidez y alto nivel. La capacidad creativa que necesitas, sin sumar estructura, sueldos ni gestión extra.",
      introTitleTertiaryLines: [
        "«Las personas no compran",
        "productos ni servicios. ",
        "Compran historias.»",
      ],
      introDescriptionTertiaryLines: [
        "Construimos marcas y webs que comunican valor con claridad,",
        "conectan rápido y convierten visitas en oportunidades reales.",
        "Mejor mensaje, más confianza, más ventas.",
      ],
      introTertiaryCta: "Hablemos de mi web",
      captionLine: {
        line1: "Deja que, tus",
        line2: "clientes, cuenten",
        line3Before: "tu, ",
        accent: "historia",
        line3After: "",
        line4: "",
      },
      principleLines: [
        { top: "\u00A0", bottom: "CLARIDAD" },
        { top: "CLARIDAD", bottom: "SEÑAL" },
        { top: "SEÑAL", bottom: "PRUEBA" },
        { top: "PRUEBA", bottom: "HISTORIA" },
        { top: "HISTORIA", bottom: "ACTITUD" },
        { top: "ACTITUD", bottom: "\u00A0" },
      ],
    },
    danielRoomEmbed: {
      overview: {
        title: "El estudio",
        bodyParagraphs: [
          "Mente Maestra es un espacio digital donde las ideas toman forma y avanzan con dirección.",
          "Convertimos visión en marca, planes en diseño y conceptos en productos listos para lanzar.",
          "Pensamos con claridad, ejecutamos con criterio y llevamos cada proyecto hasta que esté listo para crecer.",
        ],
      },
      computer: {
        title: "En el escritorio",
        body: "Aquí iteramos sistemas, UI y piezas listas para producción: lo digital primero, con entregas que se sienten en el producto real.",
      },
      paintings: {
        title: "En el muro",
        body: "Dirección de arte y narrativa visual: cuidamos cada detalle para que la experiencia de marca sea coherente en cada touchpoint.",
      },
      couch: {
        title: "En el sillón",
        body: "Conversaciones donde alineamos prioridades, tiempos y criterio — el craft digital, con tu equipo en el centro.",
      },
      paintingsSofa: {
        title: "Desde el sillón (muro)",
        body: "Misma toma base que el muro — afinaremos cámara y copy cuando definamos el encuadre desde el sofá.",
      },
    },
    processFeatures: {
      cards: {
        backlog: {
          kicker: "Backlog y trabajo creativo",
          title: "Delega tus tareas acumuladas de diseño en un partner on-demand.",
          description:
            "Nos encargamos de organizar, ejecutar y dar salida a las necesidades creativas de tu marca, mientras tú te enfocas en operar y hacer crecer el negocio. Priorizamos lo que realmente genera impacto, para que el diseño avance con claridad y velocidad.",
        },
        tickets: {
          kicker: "Tickets y delivery del equipo",
          title:
            "Un solo lugar para monitorear qué está live, bloqueado o aun está en proceso.",
          description:
            "Seguimos tickets con dueños y fechas claras, mantenemos proyectos como equipo y matamos el loop infinito de “¿en qué va esto?”.",
        },
      },
      bottomCard: {
        lead:
          "De la idea al lanzamiento, sin fricción. Descubrimiento, ejecución, revisiones y entrega en un sistema diseñado para mantener backlog, producción y stakeholders alineados en cada etapa.",
        steps: {
          diagnostico: {
            title: "Diagnóstico",
            description: "Entiende objetivos, contexto y cuellos de botella.",
          },
          produccion: {
            title: "Producción",
            description: "Ejecución, sistema de diseño, activos y entrega.",
          },
          alineacion: {
            title: "Alineación",
            description: "Revisiones, stakeholders e iteraciones.",
          },
          lanzamiento: {
            title: "Lanzamiento",
            description: "Entrega y salida a producción.",
          },
        },
      },
    },
    onboarding: {
      stepLabel: "Onboarding",
      stepOf: "Paso {n} de {total}",
      question: "¿Qué tipo de proyecto quieres construir?",
      hint: "Elige la opción que mejor encaje; siempre lo refinamos contigo.",
      types: {
        web: "Sitio o experiencia web",
        product: "Producto digital / app",
        brand: "Marca e identidad",
        other: "Otro / aún no lo tengo claro",
      },
      actions: {
        next: "Continuar",
        back: "Atrás",
      },
      timeline: {
        selectedSuffix: ", seleccionada",
        question: "¿Para cuándo lo necesitas?",
        hint: "Sólo orientación — lo cerramos con calendario real en la llamada.",
        options: {
          super_soon: {
            labelPrefix: "SUPER ",
            labelTail: "SOON",
            line: "1–5 días",
          },
          asap: { label: "Pronto", line: "10–21 días" },
          mid: { label: "En ritmo medio", line: "~6 semanas" },
          flexible: { label: "Sin apuro", line: "8+ semanas" },
        },
      },
      budget: {
        question: "¿Qué rango de inversión tienes en mente?",
        hint: "Rangos orientativos en USD. Si facturamos distinto, lo vemos en la llamada.",
        options: {
          budget_1_3k: { label: "1k – 3k", line: "Piezas acotadas o descubrimiento" },
          budget_3_10k: { label: "3k – 10k", line: "Sprint de marca o sitio acotado" },
          budget_10k_plus: { label: "10k+", line: "Sitio completo, producto o retainer" },
          prefer_not: { label: "Prefiero no decir", line: "Lo vemos en la llamada" },
        },
      },
      result: {
        title: "Te sugerimos este camino",
        subtitle:
          "Primera lectura según lo que marcaste. Abajo te contamos cómo suele verse en la práctica; el alcance y la factura los cerramos contigo en la llamada.",
        primaryDesignPartner:
          "Tu perfil encaja con **Design Partner**: un socio fijo de diseño y producto (ritmo mensual, cupos limitados) para seguir construyendo sin contratar un equipo interno completo.",
        primaryLaunch:
          "Tu perfil encaja con un **Launch Website**: un proyecto de alcance cerrado con precio definido — pensado para lanzar o vender con una historia clara en unas pocas semanas.",
        primaryBrandSprint:
          "Tu perfil encaja con un **Brand Sprint**: un bloque de trabajo concentrado para dejar listo el discurso y el sistema visual base antes de invertir en un sitio o producto grande.",
        explainer: {
          cardTitle: "Cómo suele verse en la práctica",
          timeframeLabel: "Plazo orientativo",
          processLabel: "Proceso",
          deliverablesLabel: "Entregables",
          brandSprint: {
            timeframe:
              "Suele ser de **2 a 4 semanas** en calendario, con sesiones agrupadas (no un retainer abierto de meses).",
            process:
              "Arrancamos con kickoff y entrevistas breves, síntesis de audiencia y competencia, taller de dirección si aplica, y ciclos cortos de revisión hasta congelar decisiones.",
            deliverables:
              "Documento de posicionamiento, narrativa core (mensajes y tono), dirección visual (logo o evolución, paleta, tipografía), mini-sistema de componentes o guía de uso, y handoff listo para que tu equipo o dev lo implemente.",
          },
          launchWebsite: {
            timeframe:
              "En la práctica solemos hablar de **unas 6 semanas** desde kickoff a deploy, según contenido y complejidad — siempre con alcance cerrado por escrito.",
            process:
              "Wireframes o estructura de página, diseño UI en Figma, implementación (Next en nuestro stack), contenido que tú provees o apoyamos a encajar, QA y puesta en producción.",
            deliverables:
              "Sitio de lanzamiento responsive, SEO técnico base, formularios / analítica acordados, repositorio y deploy documentado, y una sesión de entrega para que sepas mantenerlo o iterar.",
          },
          designPartner: {
            timeframe:
              "Es un **ritmo mensual** renovable: no es una fecha única de “entrega final”, sino un calendario de prioridades que vamos ajustando contigo.",
            process:
              "Planificación por quincenas o sprintes cortos, canal directo para pedidos, reviews recurrentes y priorización explícita para que el diseño no compita con urgencias imprevistas.",
            deliverables:
              "Lo que entra cada mes depende del acuerdo (UI, marca, landings, apoyo a producto, etc.), siempre con entregables revisables y trazabilidad — sin prometer “todo ilimitado” sin foco.",
          },
        },
        bookEyebrow: "Siguiente paso",
        bookTitle: "Agenda una llamada exploratoria",
        bookSubtitle:
          "Elige horario y cuéntanos un poco más; usamos el mismo flujo de reserva que en la landing.",
        dialogAriaLabel: "Confirmar reunión exploratoria",
        backToHome: "Volver a MenteMaestra",
      },
    },
    hero: {
      /** Hero CTA copy; cycles on hover-out without a click (parallel to `en`). */
      ctaRotate: [
        "Comencemos",
        "Elevar marca",
        "Crecer y escalar",
        "Construye tu sitio",
        "Conversa con nosotros",
        "Demosle",
      ],
      subtitle:
        "Branding y diseño estratégico para negocios en expansión",
      description:
        "Branding, producto y sitios de lanzamiento. Claridad, conversión y oficio — no una lista infinita de servicios creativos.",
      scopeLine:
        "Para founders y equipos en fintech, devtools y servicios en lanzamiento o primera ronda.",
      badge: "Estudio boutique · desde 2022",
    },
    welcome: {
      label: "Claridad, conversión, oficio",
      magicLead: "Estudio de diseño en ritmo con tu negocio",
      headline:
        "Diseñamos ‖interfaces‖ que reflejan el oficio y la calidad de tu negocio, para que tus clientes entiendan de un vistazo el ‖valor‖ del servicio que ofreces.",
      magicBody:
        "Branding, producto y sitios de lanzamiento pensados para decisiones de compra: una historia clara, una interfaz confiable y un sitio que convierte. Sin freelances sueltos, sin promesas vagas.",
      highlightsLead: ["diseño"],
      highlightsBody: ["clara", "confiable", "convierte"],
    },
    features: {
      customizable: {
        title: "Personalizable",
        body:
          "Tu marca, contenido y flujos. Definidos de punta a punta sin plantillas genéricas que te frenen.",
      },
      secure: {
        title: "Seguridad a cargo nuestro",
        body:
          "Seguimos buenas prácticas, mantenemos el código al día para evitar brechas y hacks, rotamos llaves con frecuencia y nos hacemos responsables de tu seguridad para que tú te enfoques en tu negocio.",
      },
      seo: {
        title: "Optimizado para SEO",
        body:
          "Integramos la conversación de SEO desde el inicio. Estructura, metadatos y rendimiento. Para que tus clientes te encuentren de verdad.",
      },
      growth: {
        title: "Crecimiento sostenido",
        body:
          "Un socio de diseño que atiende tus pedidos casi en tiempo real. Para que el impulso no se detenga después del lanzamiento.",
      },
      assets: {
        title: "Activos digitales, juntos",
        body:
          "Una forma simple de gestionar tus activos digitales con tu equipo. Contexto compartido, aprobaciones y una sola fuente de verdad.",
      },
      teamAvatars: [
        { name: "Dirección creativa" },
        { name: "Producto" },
        { name: "Marketing" },
      ],
    },
    services: {
      title: "Cómo trabajamos",
      subtitle:
        "Entradas claras, precio cerrado y un camino directo al lanzamiento — no un menú infinito.",
      cta: "Ver precios",
      items: [
        {
          id: "brand-sprint",
          name: "Brand Sprint",
          forWhom: "Founders pre-lanzamiento o en pivot.",
          outcome:
            "Posicionamiento, narrativa y sistema visual listos para salir a decir con claridad qué hacen y para quién.",
          cta: "Cotizar Brand Sprint",
          href: "/#book-meeting",
        },
        {
          id: "launch-website",
          name: "Launch Website",
          forWhom: "Equipos con producto validado listos para vender.",
          outcome:
            "Sitio de lanzamiento enfocado en conversión — diseño, código y deploy en ~6 semanas, alcance cerrado.",
          cta: "Cotizar sitio",
          href: "/pricing#pricing",
        },
        {
          id: "design-partner",
          name: "Design Partner",
          forWhom: "Equipos en crecimiento que ya cuidan su marca.",
          outcome:
            "Socio continuo de diseño y producto con ritmo de estudio. Cupos limitados — sólo 2 activos a la vez.",
          cta: "Ver retainer",
          href: "/pricing#pricing",
        },
      ],
    },
    marquee: {
      items: [
        "BRANDING · PRODUCTO · LANZAMIENTO",
        "ESTRATEGIA, NARRATIVA Y SISTEMA VISUAL",
        "SITIOS QUE CONVIERTEN, NO SÓLO DECORAN",
        "PRODUCTO QUE SE SIENTE CONFIABLE DESDE EL PRIMER CLICK",
        "BOUTIQUE · CUPOS LIMITADOS · DESDE 2022",
      ],
    },
    featured: {
      label: "Proyectos destacados",
      magic:
        "Marcas y productos que hoy explican su valor de un vistazo y convierten mejor que antes.",
      prev: "Anterior",
      next: "Siguiente",
      magicHighlights: ["explican", "convierten"],
      intro:
        "Una selección breve de trabajos recientes. Cada uno resolvió un problema concreto: aclarar la propuesta, lanzar el producto o preparar una ronda.",
    },
    stack: {
      label: "Stack moderno",
      blurb:
        "Construimos con herramientas que usamos cada día—del framework al contenido y al comercio.",
    },
    testimonials: {
      badge: "diseño a la velocidad de tu negocio · est. 2022 ·",
      items: [
        {
          quote:
            "En el estudio nos apasiona diseñar interfaces que reflejen el oficio y la calidad de tu negocio, para que tus clientes entiendan de un vistazo el valor del servicio que ofreces.",
          author: "Joaquin Farfan",
          role: "CEO y director creativo, MenteMaestra",
        },
      ],
    },
    blogPosts: {
      eyebrow: "Perspectivas",
      title: "Ideas desde el estudio",
      subtitle:
        "Notas breves sobre marca, producto y lanzamiento. Publicamos cuando hay algo que valga la pena compartir.",
      readCta: "Leer",
      nextCta: "Siguiente artículo",
      items: [
        {
          title: "Por qué tu sitio de lanzamiento necesita una sola historia",
          description:
            "Cuando cada bloque compite por atención, el visitante se va sin decidir. Cómo ordenar mensaje y prueba social.",
          href: "/blog/una-sola-historia-lanzamiento",
        },
        {
          title: "Sistemas de diseño que sí se usan en sprint",
          description:
            "Tokens, componentes y documentación mínima para equipos pequeños que necesitan velocidad sin deuda visual.",
          href: "/blog/sistema-diseno-sprint",
        },
        {
          title: "De la propuesta de valor a la interfaz",
          description:
            "Traducir posicionamiento en jerarquía, microcopy y estados vacíos — sin diluir el mensaje en pantallas.",
          href: "/blog/valor-a-interfaz",
        },
        {
          title: "Checklist antes de pedir una cotización seria",
          description:
            "Qué tener listo (alcance, referencias, métricas) para que la primera reunión sea productiva, no exploratoria infinita.",
          href: "/blog/checklist-cotizacion",
        },
      ],
    },
    awards: {
      label: "Impacto reconocido",
      magic1:
        "El reconocimiento llega cuando la idea es audaz, la ejecución es precisa y el trabajo hace avanzar a la marca.",
      magic2:
        "Estos hitos reflejan el estándar que aportamos a cada asociación con MenteMaestra.",
      tableAward: "Premio",
      tableDate: "Fecha",
      list: [
        {
          organization: "Awwwards",
          title: "SOTY 2023 - 1st Winner",
          date: "May 2023",
        },
        {
          organization: "css awards",
          title: "Top 5 Best of eCommerce Websites 2022",
          date: "Dec 2022",
        },
        {
          organization: "Awwwards",
          title: "Honor SOTD November, 2022",
          date: "Nov 2022",
        },
        {
          organization: "Behance Portfolio",
          title: "Winner - US Behance Portfolio Review 2021",
          date: "Aug 2021",
        },
      ],
      highlights1: ["audaz", "precisa", "marca"],
      highlights2: ["estándar", "MenteMaestra", "asociación"],
    },
    experience: {
      leftLabel: "Estudio enfocado · no agencia generalista",
      brainThoughts: [
        "Marca, producto y sitio alineados.",
        "Diseño con criterio y constancia.",
        "Menos ruido, más impacto.",
        "Claridad en cada punto de contacto.",
      ],
      leftTitle:
        "Estrategia, diseño y desarrollo en una sola alianza enfocada — desde el kickoff hasta el lanzamiento.",
      leftBody:
        "Un socio boutique para founders que quieren marca y producto coherentes, con ritmo de estudio y ejecución impecable en cada punto de contacto.",
      stat1Label: "Trayectoria",
      stat1Title:
        "Acompañamos a founders y equipos creativos a conectar su oficio con clientes que valoran el trabajo bien hecho.",
      stat1Unit: "Años como\nestudio",
      stat2Label: "Proyectos entregados",
      stat2Title:
        "Marcas, productos y sitios de lanzamiento — entregas cerradas y medibles, sin cola infinita de tareas.",
      stat2Unit: "Proyectos\nen vivo",
      stat3Label: "Compromiso",
      stat3Title: "Claridad, conversión y oficio como base.",
      stat3Body:
        "Invertimos en procesos, herramientas y relaciones que evolucionan para que cada proyecto gane en calidad creativa e impacto con el tiempo.",
    },
    pricing: {
      sectionLabel: "Precios y modalidad",
      title: "Proyecto cerrado o socio continuo",
      subtitle:
        "Arrancamos con proyectos de alcance cerrado — Brand Sprint o Launch Website. El retainer Design Partner queda reservado para clientes activos, con cupos limitados.",
      mostPopular: "Así de perfecto",
      subscription: "Suscripción",
      monthly: "Mensual",
      yearly: "Anual",
      billedYearlyNote: "Facturación anual · ahorro vs. trabajo puntual",
      priceYearly: "CLP / año",
      priceMonthlyClp: "CLP / mes",
      priceMonthlyUsd: "USD / mes",
      subNoteMonthly:
        "Un asiento. Peticiones ilimitadas. Pausa cuando quieras.",
      subNoteYearly: "Facturación anual · equivalente a ahorro vs. por pieza",
      subIncludes: [
        "Peticiones ilimitadas: sitios, marca, contenido, redes y más",
        "Entrega rápida: 1–3 días por tarea (según complejidad)",
        "Pausa cuando quieras — sin contratos largos ni mínimos",
      ],
      subTagline:
        "El equilibrio entre alcance, velocidad y libertad para pausar cuando quieras.",
      projectCta: "Iniciar proyecto",
      subCta: "Suscribirse",
      unlimitedTitle: "MenteMaestra Ilimitado",
      subscriptionTiers: [
        {
          id: "website",
          tierKind: "project",
          categoryLabel: "Proyecto web",
          name: "Sitio completo",
          blurb:
            "Diseño, implementación y sitio listo; más un mantenimiento anual para hosting, dominio, correo y operación.",
          popular: false,
          priceOneTime: "$1.800.000",
          priceOneTimeLabel: "CLP",
          priceOneTimeNote:
            "Inversión única por el proyecto (diseño, desarrollo y despliegue acordados).",
          yearlyMaintenance: "$400.000",
          yearlyMaintenanceLabel: "CLP / año",
          yearlyMaintenanceNote:
            "Mantenimiento: seguridad, hosting, dominio, disponibilidad del sitio y correo.",
          priceMonthly: "",
          priceNote: "",
          features: [
            "Diseño UX/UI e implementación web de principio a fin",
            "Precio cerrado para el entregable del sitio en alcance definido",
            "Plan anual para uptime, hosting, dominio y canal de correo",
            "Actualizaciones de seguridad y continuidad operativa del sitio",
          ],
        },
        {
          id: "studio",
          tierKind: "subscription",
          categoryLabel: "Design Partner (retainer)",
          name: "Studio",
          blurb:
            "Socio continuo de diseño y producto para clientes activos. Cupos limitados — sólo 2 activos a la vez.",
          popular: true,
          priceOneTime: "",
          priceOneTimeLabel: "",
          priceOneTimeNote: "",
          yearlyMaintenance: "",
          yearlyMaintenanceLabel: "",
          yearlyMaintenanceNote: "",
          priceMonthly: "$1.480.000",
          priceNote:
            "Peticiones ilimitadas dentro del alcance Studio · ritmo de socio creativo.",
          features: [
            "Un plan mensual que cubre lo digital y lo creativo de punta a punta",
            "Respuesta rápida y prioridad en la cola de trabajo",
            "Sitio, marca, contenido y mejoras continuas sin renegociar cada pedido",
            "Pausa o cancela cuando quieras — sin contratos largos ni letra chica",
          ],
        },
        {
          id: "unlimited",
          tierKind: "subscription",
          categoryLabel: "Retainer extendido",
          name: "Ilimitado",
          blurb:
            "Cobertura integral para marcas activas que ya pasaron por Brand Sprint o Launch Website y necesitan todos los frentes a la vez.",
          popular: false,
          priceOneTime: "",
          priceOneTimeLabel: "",
          priceOneTimeNote: "",
          yearlyMaintenance: "",
          yearlyMaintenanceLabel: "",
          yearlyMaintenanceNote: "",
          priceMonthly: "$3.100.000",
          priceNote:
            "El plan más amplio: redes, contenido, producto y branding en un solo retainer.",
          features: [
            "Gestión y mantenimiento de redes sociales",
            "Creación de contenido, video y fotografía",
            "Desarrollo, diseño y mantenimiento web",
            "Todas las consultas de diseño, incluidos paquetes de branding",
          ],
        },
      ],
      subFootnote:
        "Los proyectos sitio completo arrancan en ",
      subFootnoteEnd: " — nuestro pilar en alcances definidos.",
      oneTime: "Proyectos puntuales",
      oneTimeBlurb:
        "Alcance y precio cerrados: ideal cuando ya sabes el resultado. Incluye y no incluye está explícito.",
      tableService: "Servicio",
      tableUsd: "USD",
      tableClp: "CLP",
      tableIncludes: "Incluye",
      tableNotIncluded: "No incluye",
      projectsPopular: "Favorito · Proyectos",
      projectRows: [
        {
          service: "Diseño web",
          includes:
            "UX/UI, sistema en Figma listo para producción, layouts responsive, hasta 2 rondas de revisión",
          notIncluded: "Desarrollo, hosting",
          popular: false,
        },
        {
          service: "Desarrollo web",
          includes:
            "Implementación fiel al diseño, build responsive, optimización de rendimiento",
          notIncluded: "Diseño, actualizaciones recurrentes",
          popular: false,
        },
        {
          service: "Sitio completo",
          includes:
            "Diseño + desarrollo, sitio listo para deploy, CMS, hasta 2 rondas (diseño + código)",
          notIncluded: "Actualizaciones de diseño continuas",
          popular: true,
        },
        {
          service: "Paquete de marca",
          includes:
            "Sistema de logo, paleta, tipografía, guías, mockups y activos de marca",
          notIncluded: "Sitio web, diseño continuo",
          popular: false,
        },
      ],
      alaCarteTitle: "Pagar por pieza encarece rápido",
      alaCarteA: "Un sitio insignia ya representa una inversión de ",
      alaCarteAmount: "$2.000 USD",
      alaCarteB:
        ". Suma diseño suelto, rebranding o páginas extra y superas varios meses de ",
      alaCarteProduct: "MenteMaestra Ilimitado",
      alaCarteC:
        " sin la misma flexibilidad. La suscripción es para equipos que quieren velocidad sin redefinir cada pedido.",
      alaCarteHint:
        "¿Prefieres un solo entregable? La tabla de proyectos es tuya. ¿Dudas? ",
      alaCarteHintBold: "Prueba un mes, vacía el backlog y pausa.",
      websitesTitle: "Sitios (por proyecto)",
      websitesIntro: "Un sitio completo suele entregarse en ~6 semanas:",
      websitesWeeks: [
        "Semanas 1–2 — Investigación, estrategia, Figma",
        "Semanas 3–4 — Desarrollo e implementación",
        "Semanas 5–6 — Pruebas, CMS, deploy y revisiones",
      ],
      subColumnTitle: "Suscripción (bajo demanda)",
      subBullets: [
        "Pide lo que necesites: sitio, marca, contenido, redes.",
        "Entregas en 1–3 días por tarea (según complejidad).",
        "Pausa cuando quieras — sin contratos ni mínimos.",
        "Ideal para un mes intensivo y luego parar con claridad.",
      ],
      howToChoose: "Cómo elegir",
      howToChooseItems: [
        "¿Un resultado claro (sitio o marca)? → Reserva un proyecto.",
        "¿Varios frentes o trabajo continuo? → Ve a ilimitado.",
        "¿Aún decidiendo? → Un mes de suscripción, luego pausa.",
      ],
      hostingTitle: "Hosting y mantenimiento ",
      hostingOptional: "(opcional)",
      hostingBullets: [
        "Incluido durante la entrega inicial.",
        "Renovación: $500/año — disponibilidad, hosting y bases de seguridad.",
      ],
      talkScope: "Conversemos el alcance",
      faqTitle: "Preguntas ",
      faqTitleAccent: "frecuentes",
      faqSubtitle:
        "Todo lo que necesitas para decidir entre un proyecto acotado y un socio a demanda.",
      faq: [
        {
          id: "project-vs-sub",
          q: "¿Cuándo elijo un proyecto puntual vs. suscripción?",
          a: "Elige proyecto cuando el resultado es uno: nuevo sitio, rebranding o solo desarrollo. Elige MenteMaestra Ilimitado cuando necesitas volumen, variedad o diseño continuo sin negociar cada alcance. Muchos equipos se suscriben un mes intenso, entregan el backlog y pausan.",
        },
        {
          id: "timeline",
          q: "¿Cuánto tarda un sitio completo en modalidad proyecto?",
          a: "La mayoría lleva unas seis semanas: 1–2 en investigación, estrategia y Figma; 3–4 en desarrollo; 5–6 en QA, CMS, deploy y revisiones. Incluimos hasta dos rondas de revisión en diseño y dos en sitio en vivo.",
        },
        {
          id: "revisions",
          q: "¿Qué cuenta como revisión?",
          a: "Rondas estructuradas de feedback sobre la misma dirección, no experimentación infinita. En proyectos: dos rondas en Figma y dos en el sitio. En suscripción, la iteración sigue dentro de la ventana de 1–3 días por tarea.",
        },
        {
          id: "pause",
          q: "¿Puedo pausar o cancelar la suscripción?",
          a: "Sí. Pausa cuando no estés lanzando; cancela cuando termines — sin ataduras. Usa un mes para limpiar backlog y retoma cuando toque.",
        },
        {
          id: "hosting",
          q: "¿El hosting está incluido? ¿Y el mantenimiento?",
          a: "El hosting está cubierto en la entrega inicial. Tras el lanzamiento, la renovación opcional es 500 USD/año por uptime, hosting y bases de seguridad.",
        },
        {
          id: "billing",
          q: "¿Facturan en USD, CLP o ambos?",
          a: "Mostramos ambos por transparencia. La facturación final sigue tu acuerdo — si necesitas documentación chilena o impuestos, lo alineamos en el onboarding.",
        },
      ],
      usdAmounts: ["$1,000", "$1,800", "$2,000", "$1,800"],
      clpAmounts: ["$860.000", "$1.500.000", "$1.800.000", "$1.500.000"],
    },
    book: {
      section: {
        eyebrow: "Cotiza tu proyecto",
        title: "Agenda una reunión exploratoria",
        subtitle:
          "Elige fecha y horario. En el siguiente paso completas tus datos y confirmamos el encuentro.",
        qualificationTitle: "Antes de agendar",
        idealForLabel: "Ideal para",
        idealFor: [
          "Founders en fintech, devtools o servicios con producto validado o en lanzamiento.",
          "Equipos que necesitan claridad de marca y un sitio que convierta.",
          "Proyectos con presupuesto desde ~$2.000 USD (Launch Website) o retainer continuo.",
        ],
        typicalLabel: "Proyectos típicos",
        typicalProjects: [
          "Brand Sprint — posicionamiento, narrativa y sistema visual.",
          "Launch Website — sitio de lanzamiento enfocado en conversión.",
          "Design Partner — socio continuo de diseño y producto (cupos limitados).",
        ],
        notForLabel: "Probablemente no somos el match",
        notFor:
          "si necesitas tareas sueltas, freelance de bajo costo o suscripción ilimitada tipo ticket.",
      },
      meeting: {
        cardTitle: "Reserva tu cita",
        selectPrompt: "Selecciona fecha y hora para tu reunión.",
        summaryLead: "Tu reunión exploratoria quedaría el",
        summaryAt: "a las",
        continue: "Continuar",
        noSlotsForDay:
          "No hay horarios disponibles este día. Prueba otra fecha.",
        availabilityDbWarning:
          "No hay base de datos conectada: los huecos pueden no reflejar reservas reales. Configura DATABASE_URL en el servidor.",
        availabilityDbQueryFailed:
          "DATABASE_URL está definido pero no pudimos leer reservas. En Supabase añade ?pgbouncer=true al pooler (puerto 6543), asegura sslmode=require, codifica la contraseña en la URL y ejecuta la migración 001_bookings.sql en este proyecto.",
        availabilityCaldavWarning:
          "No pudimos leer tu calendario iCloud (CalDAV). Los huecos siguen la cuadrícula del sitio; revisa ICLOUD_* y los logs.",
      },
      confirm: {
        title: "Confirma tu reunión",
        subtitle: "Completa tus datos y envíanos el contexto que quieras.",
        back: "Cambiar fecha u hora",
        slotLabel: "Horario elegido",
        name: "Nombre completo",
        email: "Correo",
        company: "Empresa (opcional)",
        message: "¿Qué debemos saber? (opcional)",
        submit: "Confirmar reunión exploratoria",
        submitting: "Enviando…",
        successTitle: "Listo",
        successBody: "Cita agendada correctamente.",
        successEmailLine:
          "Te enviamos los detalles por correo (revisa spam).",
        successNothingConfigured:
          "Aún no hay integración activa (correo o .ics). Con los datos que enviaste, el equipo te contactará para coordinar.",
        backHome: "Volver al inicio",
        missingSlot: "Primero elige fecha y hora en la página principal.",
        error: "No se pudo enviar. Intenta de nuevo.",
        slotUnavailable:
          "Ese horario ya no está disponible. Elige otra fecha u hora.",
        databaseNotConfigured:
          "Reservas no disponibles: falta DATABASE_URL en el servidor.",
        organizerNotConfigured:
          "Falta BOOKING_ORGANIZER_EMAIL en el servidor para enviar la invitación.",
        icsBuildFailed:
          "La reserva se guardó pero falló generar el calendario. Contacta al equipo con la fecha y hora elegidas.",
        successEmailNotSentHint:
          "La reserva quedó guardada, pero no pudimos enviar correos: verifica tu dominio en Resend (resend.com/domains) o usa RESEND_FROM_EMAIL con un remitente de un dominio ya verificado. Puedes descargar el .ics abajo.",
        downloadIcs: "Descargar invitación (.ics)",
        addToGoogleCalendar: "Google Calendar",
      },
    },
    footer: {
      titleLine1: "Mente",
      titleLine2: "Maestra",
      /** Matches portal footer logotype — small caps under the script line. */
      designStudioLabel: "DESIGN STUDIO",
      tagline:
        "Socio creativo para equipos que buscan claridad visual y ejecución senior sin montar un estudio interno completo.",
      menuTitle: "Menú",
      newsletterTitle: "Newsletter",
      newsletterHint:
        "Ideas puntuales sobre identidad de marca y diseño digital.",
      subscribe: "Suscribirse",
      socialTitle: "Redes sociales",
      support: "Soporte",
      newsletter:
        "Recibe primero noticias sobre tendencias, inspiración y más",
      emailLabel: "Correo",
      emailPlaceholder: "Tu correo electrónico",
      privacyNote: "Al suscribirte aceptas nuestra ",
      privacyLink: "Política de privacidad",
      workInquiry: "Contacto comercial",
      workEmail: "info@mentemaestra.studio",
      workPhone: "+56994621925",
      openPosition: "Posiciones abiertas",
      job1: "Desarrollador Front-end senior",
      job2: "Diseñador UI/UX (remoto)",
      locationTitle: "Santiago, Chile",
      address: "Eliodoro Yáñez 2990, Providencia, Santiago de Chile",
      linksTitle: "Enlaces",
      terms: "Términos y condiciones",
      privacy: "Política de privacidad",
      copyright: "© 2026 MenteMaestra SPA.",
      rights: "Todos los derechos reservados",
    },
  },
  en: {
    nav: {
      design: "Design",
      services: "Services",
      works: "Works",
      experience: "Experience",
      book: "Book",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Start Project",
      speakToHuman: "Speak to a human now",
      portalLogin: "Portal login",
    },
    portalRecover: {
      metaTitle: "Portal access — MenteMaestra",
      metaDescription:
        "Recover your project portal link using your authorized email address.",
      title: "Portal access",
      subtitle:
        "If you forgot your project link, enter the email address you were invited with. If it is on a project allowlist, we will email you a secure sign-in link.",
      emailLabel: "Portal access email",
      emailPlaceholder: "you@company.com",
      hint: "It must match the email on the project allowlist. If you are on multiple projects, you may receive more than one message.",
      submit: "Email magic link",
      sending: "Sending…",
      success:
        "If your email is authorized for any project, we sent a link within a few minutes. Check your inbox and spam.",
      error: "We could not complete the request. Please try again later.",
      backHome: "← Back to home",
    },
    about: {
      sectionTitle: "About",
      introTitle: "The creative partner for growing companies.",
      introTitleSecondary: "Senior design, without hiring an in-house team",
      introDescription:
        "We’re a digital studio based in Santiago, Chile. We design brands, websites, and digital experiences with a premium focus: visual clarity, elegant execution, and strategic detail so your business projects trust and value at every touchpoint.",
      introDescriptionSecondary:
        "Websites, apps, branding, and graphic content delivered quickly and to a high standard. The creative capacity you need—without adding headcount, payroll, or extra management.",
      introTitleTertiaryLines: [
        "“People don’t buy",
        "products or services. ",
        "They buy stories.”",
      ],
      introDescriptionTertiaryLines: [
        "We build brands and websites that communicate value clearly,",
        "connect fast, and turn visits into real opportunities.",
        "Better messaging, more trust, more sales.",
      ],
      introTertiaryCta: "Let’s talk about my website",
      captionLine: {
        line1: "Let your,",
        line2: "customers tell",
        line3Before: "your, ",
        accent: "story",
        line3After: "",
        line4: "",
      },
      principleLines: [
        { top: "\u00A0", bottom: "CLARITY" },
        { top: "CLARITY", bottom: "SIGNAL" },
        { top: "SIGNAL", bottom: "PROOF" },
        { top: "PROOF", bottom: "STORY" },
        { top: "STORY", bottom: "SWAG" },
        { top: "SWAG", bottom: "\u00A0" },
      ],
    },
    danielRoomEmbed: {
      overview: {
        title: "The studio",
        bodyParagraphs: [
          "Mente Maestra is a digital space where ideas take shape and move with direction.",
          "We turn vision into brand, plans into design, and concepts into launch-ready product.",
          "We think with clarity, ship with judgment, and carry every project until it’s ready to grow.",
        ],
      },
      computer: {
        title: "At the desk",
        body: "Where we iterate systems, UI, and production-ready work — digital first, crafted to land in the real product.",
      },
      paintings: {
        title: "On the wall",
        body: "Art direction and visual narrative — every detail tuned so the brand experience holds together across touchpoints.",
      },
      couch: {
        title: "On the sofa",
        body: "Where we align on priorities, timelines, and taste — digital craft, with your team at the center.",
      },
      paintingsSofa: {
        title: "From the sofa (wall)",
        body: "Same base framing as the wall shot — we’ll tune camera and copy once the sofa view is locked in.",
      },
    },
    processFeatures: {
      cards: {
        backlog: {
          kicker: "Backlog & creative work",
          title: "Hand off your design backlog to an on-demand partner.",
          description:
            "We organize, execute, and ship the creative needs of your brand while you focus on operating and growing the business. We prioritize what actually creates impact, so design moves forward with clarity and speed.",
        },
        tickets: {
          kicker: "Tickets & team delivery",
          title: "A single place to monitor what’s live, blocked, or still in progress.",
          description:
            "Track tickets with clear owners and dates, run projects as a team, and kill the endless “where is this?” loop.",
        },
      },
      bottomCard: {
        lead:
          "From idea to launch, frictionless. Discovery, execution, reviews, and delivery in a system designed to keep backlog, production, and stakeholders aligned at every stage.",
        steps: {
          diagnostico: {
            title: "Diagnóstico",
            description: "Understand goals, context, bottlenecks.",
          },
          produccion: {
            title: "Producción",
            description: "Execution, design systems, assets, delivery.",
          },
          alineacion: {
            title: "Alineación",
            description: "Reviews, stakeholders, iterations.",
          },
          lanzamiento: {
            title: "Lanzamiento",
            description: "Entrega / Go Live.",
          },
        },
      },
    },
    onboarding: {
      stepLabel: "Onboarding",
      stepOf: "Step {n} of {total}",
      question: "What type of project are you looking to build?",
      hint: "Pick what fits best—we’ll refine the details with you.",
      types: {
        web: "Website or web experience",
        product: "Digital product / app",
        brand: "Brand & identity",
        other: "Other / not sure yet",
      },
      actions: {
        next: "Continue",
        back: "Back",
      },
      timeline: {
        selectedSuffix: ", selected",
        question: "When do you need it?",
        hint: "Rough timing—we’ll align on a real schedule in the call.",
        options: {
          super_soon: {
            labelPrefix: "SUPER ",
            labelTail: "SOON",
            line: "1–5 days",
          },
          asap: { label: "Soon", line: "10–21 days" },
          mid: { label: "Mid-range", line: "~6 weeks" },
          flexible: { label: "No rush", line: "8+ weeks" },
        },
      },
      budget: {
        question: "What budget range are you thinking?",
        hint: "Ballpark USD. If billing works differently for you, we’ll align on the call.",
        options: {
          budget_1_3k: { label: "1k – 3k", line: "Tight scope or discovery" },
          budget_3_10k: { label: "3k – 10k", line: "Brand sprint or focused site" },
          budget_10k_plus: { label: "10k+", line: "Full launch site, product, or retainer" },
          prefer_not: { label: "Prefer not to say", line: "We’ll discuss live" },
        },
      },
      result: {
        title: "Here’s what we’d recommend",
        subtitle:
          "A first read from what you selected. Below is how it usually works in practice—scope and invoicing are finalized with you on the call.",
        primaryDesignPartner:
          "Your answers point to **Design Partner**: a steady design & product partner on a monthly rhythm (limited slots) so you can keep shipping without building a full in-house creative team.",
        primaryLaunch:
          "Your answers point to a **Launch Website**: a fixed-scope, fixed-price project meant to launch or sell with a clear story in a few focused weeks.",
        primaryBrandSprint:
          "Your answers point to a **Brand Sprint**: a concentrated block of work to lock narrative and a baseline visual system before you invest in a larger site or product build.",
        explainer: {
          cardTitle: "How it usually works",
          timeframeLabel: "Typical timeframe",
          processLabel: "Process",
          deliverablesLabel: "Deliverables",
          brandSprint: {
            timeframe:
              "Usually **2–4 calendar weeks**, with sessions clustered (not an open-ended multi-month retainer).",
            process:
              "Kickoff + short stakeholder interviews, audience/competitive synthesis, direction workshop where it helps, then tight review cycles until decisions are frozen.",
            deliverables:
              "Positioning doc, core narrative (messages + tone), visual direction (logo or evolution, palette, type), a starter component set or usage guide, and handoff your team or dev can implement.",
          },
          launchWebsite: {
            timeframe:
              "In practice we often land around **~6 weeks** from kickoff to deploy, depending on content and complexity—always with a written fixed scope.",
            process:
              "Page structure / wires, UI design in Figma, implementation (Next in our stack), your content (or we help slot it), QA, and production deploy.",
            deliverables:
              "Responsive launch site, baseline technical SEO, agreed forms/analytics, documented repo + deploy, and a walkthrough so you can maintain or iterate.",
          },
          designPartner: {
            timeframe:
              "A **monthly rhythm** (renewable): not a single “final delivery” date, but a rolling priority calendar we adjust with you.",
            process:
              "Biweekly or short-sprint planning, a direct channel for requests, recurring reviews, and explicit prioritization so design work doesn’t lose to random fire drills.",
            deliverables:
              "What ships each month depends on the agreement (UI, brand, landings, product support, etc.)—always reviewable increments and traceability, not vague “unlimited everything.”",
          },
        },
        bookEyebrow: "Next step",
        bookTitle: "Book an exploratory call",
        bookSubtitle:
          "Pick a time and share a bit more—we use the same booking flow as on the homepage.",
        dialogAriaLabel: "Confirm exploratory meeting",
        backToHome: "Back to MenteMaestra",
      },
    },
    hero: {
      /** Hero CTA copy; cycles on hover-out without a click (parallel to `es`). */
      ctaRotate: [
        "Let's build",
        "Let's ship it",
        "Let's cook",
        "Let's do this",
        "Lock in, baby",
        "Run it",
      ],
      subtitle:
        "Strategic branding and design for businesses that are scaling.",
      description:
        "Branding, product, and launch websites. Clarity, conversion, and craft — not an endless list of creative services.",
      scopeLine:
        "For founders and teams in fintech, devtools, and services launching or raising their first round.",
      badge: "Boutique studio · since 2022",
    },
    welcome: {
      label: "Clarity, conversion, craft",
      magicLead: "A design studio in rhythm with your business",
      headline:
        "We design ‖interfaces‖ that reflect the craftsmanship behind your business, so clients can see, at a glance, the ‖value‖ of the service you provide.",
      magicBody:
        "Branding, product, and launch websites built around buying decisions: a clear story, a trustworthy interface, and a site that converts. No stray freelancers, no vague promises.",
      highlightsLead: ["design"],
      highlightsBody: ["clear", "trustworthy", "converts"],
    },
    features: {
      customizable: {
        title: "Customizable",
        body:
          "Your brand, content, and flows. Shaped end to end without generic templates holding you back.",
      },
      secure: {
        title: "Security, handled",
        body:
          "We follow best practices, keep code updates current to stay ahead of breaches and hacks, rotate keys often, and take responsibility for your safety so you can focus on your business.",
      },
      seo: {
        title: "SEO optimized",
        body:
          "We build in the SEO conversation early. Structure, metadata, and performance. So your clients can actually find you.",
      },
      growth: {
        title: "Sustained growth",
        body:
          "A design partner who takes care of your requests in near real time. So momentum does not stop after launch.",
      },
      assets: {
        title: "Digital assets, together",
        body:
          "An easy way to manage your digital assets with your team. Shared context, approvals, and a single source of truth.",
      },
      teamAvatars: [
        { name: "Creative lead" },
        { name: "Product" },
        { name: "Marketing" },
      ],
    },
    services: {
      title: "How we work",
      subtitle:
        "Clear entry points, fixed scope, and a direct path to launch — not an infinite menu.",
      cta: "See pricing",
      items: [
        {
          id: "brand-sprint",
          name: "Brand Sprint",
          forWhom: "Founders pre-launch or pivoting.",
          outcome:
            "Positioning, narrative, and a visual system ready to say clearly what you do and who it's for.",
          cta: "Scope a Brand Sprint",
          href: "/#book-meeting",
        },
        {
          id: "launch-website",
          name: "Launch Website",
          forWhom: "Teams with validated product ready to sell.",
          outcome:
            "A launch site built for conversion — design, code, and deploy in ~6 weeks, fixed scope.",
          cta: "Scope a website",
          href: "/pricing#pricing",
        },
        {
          id: "design-partner",
          name: "Design Partner",
          forWhom: "Growing teams that already care about their brand.",
          outcome:
            "Ongoing design and product partner at studio pace. Capacity capped — only 2 active at a time.",
          cta: "See retainer",
          href: "/pricing#pricing",
        },
      ],
    },
    marquee: {
      items: [
        "BRANDING · PRODUCT · LAUNCH",
        "STRATEGY, NARRATIVE & VISUAL SYSTEM",
        "SITES THAT CONVERT, NOT JUST DECORATE",
        "PRODUCT THAT FEELS TRUSTWORTHY FROM THE FIRST CLICK",
        "BOUTIQUE · LIMITED SEATS · SINCE 2022",
      ],
    },
    featured: {
      label: "Featured Works",
      magic:
        "Brands and products that now explain their value at a glance and convert better than before.",
      magicHighlights: ["explain", "convert"],
      prev: "Prev Slide",
      next: "Next Slide",
      intro:
        "A short selection of recent work. Each one solved a concrete problem: clarify the pitch, launch the product, or prep for a round.",
    },
    stack: {
      label: "Built with a modern stack",
      blurb:
        "We ship on tools we trust every day—from the framework to content and commerce infra.",
    },
    testimonials: {
      badge: "design at the speed of business · est. 2022 ·",
      items: [
        {
          quote:
            "We're passionate about building interfaces that reflect the craftsmanship behind your business—so your clients can see, at a glance, the value of the service you provide.",
          author: "Joaquin Farfan",
          role: "CEO & Creative Director, MenteMaestra",
        },
      ],
    },
    blogPosts: {
      eyebrow: "Perspectives",
      title: "Notes from the studio",
      subtitle:
        "Short reads on brand, product, and launch. We publish when there is something worth sharing.",
      readCta: "Read",
      nextCta: "Next article",
      items: [
        {
          title: "Why your launch site needs one clear story",
          description:
            "When every section fights for attention, visitors leave without choosing. How to align message and proof.",
          href: "/blog/launch-site-one-story",
        },
        {
          title: "Design systems that survive a sprint",
          description:
            "Tokens, components, and lean docs for small teams that need speed without visual debt.",
          href: "/blog/design-system-sprint",
        },
        {
          title: "From value proposition to interface",
          description:
            "Turning positioning into hierarchy, microcopy, and empty states—without diluting the message.",
          href: "/blog/value-to-interface",
        },
        {
          title: "A checklist before you ask for a real quote",
          description:
            "What to prepare (scope, references, metrics) so the first call is productive—not an endless discovery loop.",
          href: "/blog/quote-checklist",
        },
      ],
    },
    awards: {
      label: "Proof of Impact",
      magic1:
        "Recognition follows bold thinking, sharp execution, and work that moves brands forward.",
      magic2:
        "These milestones reflect the standard we bring to every MenteMaestra partnership.",
      tableAward: "Award title",
      tableDate: "Date",
      list: [
        {
          organization: "Awwwards",
          title: "SOTY 2023 - 1st Winner",
          date: "May 2023",
        },
        {
          organization: "css awards",
          title: "Top 5 Best of eCommerce Websites 2022",
          date: "Dec 2022",
        },
        {
          organization: "Awwwards",
          title: "Honor SOTD November, 2022",
          date: "Nov 2022",
        },
        {
          organization: "Behance Portfolio",
          title: "Winner - US Behance Portfolio Review 2021",
          date: "Aug 2021",
        },
      ],
      highlights1: ["bold", "thinking", "execution", "forward"],
      highlights2: ["standard", "MenteMaestra", "partnership"],
    },
    experience: {
      leftLabel: "Focused studio · not a generalist agency",
      brainThoughts: [
        "Brand, product, and site aligned.",
        "Design with judgment and consistency.",
        "Less noise, more traction.",
        "Clear presence at every touchpoint.",
      ],
      leftTitle:
        "Strategy, design, and build in one focused partnership — from kickoff through launch.",
      leftBody:
        "A boutique partner for founders who want brand and product aligned, with studio pace and sharp execution at every touchpoint.",
      stat1Label: "Track record",
      stat1Title:
        "We help founders and creative teams connect their craft with clients who value quality.",
      stat1Unit: "Years as\na studio",
      stat2Label: "Shipped projects",
      stat2Title:
        "Brands, products, and launch sites — scoped deliveries with measurable outcomes, not an endless ticket queue.",
      stat2Unit: "Projects\nlive",
      stat3Label: "Commitment",
      stat3Title: "Clarity, conversion, and craft as the baseline.",
      stat3Body:
        "We invest in evolving tools, processes, and relationships so every engagement gains stronger creative quality and impact over time.",
    },
    pricing: {
      sectionLabel: "Pricing & engagement",
      title: "Fixed-scope project or ongoing partner",
      subtitle:
        "We start with scoped projects — Brand Sprint or Launch Website. The Design Partner retainer is reserved for active clients, with limited capacity.",
      mostPopular: "That's perfect",
      subscription: "Subscription",
      monthly: "Monthly",
      yearly: "Yearly",
      billedYearlyNote: "Billed annually · strong savings vs. à la carte",
      priceYearly: "CLP / yr",
      priceMonthlyClp: "CLP / mo",
      priceMonthlyUsd: "USD / mo",
      subNoteMonthly:
        "One seat. Unlimited requests. Pause anytime.",
      subNoteYearly:
        "Billed annually · equates to strong savings vs. à la carte",
      subIncludes: [
        "Unlimited design requests — websites, branding, content, social, and more",
        "Fast turnaround: 1–3 days per task (complexity-dependent)",
        "Pause anytime — no long contracts or minimums",
      ],
      subTagline:
        "The sweet spot between full coverage, fast replies, and the freedom to pause.",
      projectCta: "Start your project",
      subCta: "Subscribe",
      unlimitedTitle: "MenteMaestra Unlimited",
      subscriptionTiers: [
        {
          id: "website",
          tierKind: "project",
          categoryLabel: "Website project",
          name: "Complete website",
          blurb:
            "Design, build, and launch—plus an annual plan for hosting, domain, email, and day-to-day operations.",
          popular: false,
          priceOneTime: "$2,000",
          priceOneTimeLabel: "USD one-time",
          priceOneTimeNote:
            "Fixed project investment for design, development, and agreed launch scope.",
          yearlyMaintenance: "$410",
          yearlyMaintenanceLabel: "USD / year",
          yearlyMaintenanceNote:
            "Security, hosting, domain, site uptime, and email continuity.",
          priceMonthly: "",
          priceNote: "",
          features: [
            "End-to-end UX/UI design and web implementation",
            "Single scoped price for the full site deliverable",
            "Annual coverage for uptime, hosting, domain, and professional email",
            "Security updates and operational continuity for the live site",
          ],
        },
        {
          id: "studio",
          tierKind: "subscription",
          categoryLabel: "Design Partner (retainer)",
          name: "Studio",
          blurb:
            "Ongoing design and product partner for active clients. Capped at 2 active retainers at a time.",
          popular: true,
          priceOneTime: "",
          priceOneTimeLabel: "",
          priceOneTimeNote: "",
          yearlyMaintenance: "",
          yearlyMaintenanceLabel: "",
          yearlyMaintenanceNote: "",
          priceMonthly: "$1,530",
          priceNote:
            "Unlimited requests within the Studio scope—creative partner speed.",
          features: [
            "One monthly plan covering digital and creative end-to-end",
            "Fast responses and priority in the work queue",
            "Sites, brand, content, and ongoing improvements without re-scoping every ask",
            "Pause or cancel anytime—no long contracts or hidden minimums",
          ],
        },
        {
          id: "unlimited",
          tierKind: "subscription",
          categoryLabel: "Extended retainer",
          name: "Unlimited",
          blurb:
            "Full coverage for active brands that have completed Brand Sprint or Launch Website and now need every lane in motion.",
          popular: false,
          priceOneTime: "",
          priceOneTimeLabel: "",
          priceOneTimeNote: "",
          yearlyMaintenance: "",
          yearlyMaintenanceLabel: "",
          yearlyMaintenanceNote: "",
          priceMonthly: "$3,400",
          priceNote:
            "Our broadest plan—social, content, product, and branding in one retainer.",
          features: [
            "Ongoing social media management and maintenance",
            "Content creation, video, and photography",
            "Website development, design, and maintenance",
            "All design engagements, including branding packages",
          ],
        },
      ],
      subFootnote: "Full Website projects anchor at ",
      subFootnoteEnd: " — our other revenue driver for defined scopes.",
      oneTime: "One-time projects",
      oneTimeBlurb:
        "Fixed scope, fixed price—ideal when you already know the singular outcome. Includes and exclusions are explicit so there are no surprises.",
      tableService: "Service",
      tableUsd: "USD",
      tableClp: "CLP",
      tableIncludes: "Includes",
      tableNotIncluded: "Not included",
      projectsPopular: "Most popular · Projects",
      projectRows: [
        {
          service: "Web Design",
          includes:
            "UX/UI design, production-ready design system (Figma), responsive layouts, up to 2 revisions",
          notIncluded: "Development, hosting",
          popular: false,
        },
        {
          service: "Web Development",
          includes:
            "Pixel-perfect development, responsive build, performance optimization",
          notIncluded: "Design, ongoing updates",
          popular: false,
        },
        {
          service: "Full Website",
          includes:
            "Design + development, deployment-ready site, CMS setup, up to 2 revisions (design + code)",
          notIncluded: "Ongoing design updates",
          popular: true,
        },
        {
          service: "Branding Package",
          includes:
            "Logo system, color palette, typography, brand guidelines, mockups, branded assets",
          notIncluded: "Website, ongoing design",
          popular: false,
        },
      ],
      alaCarteTitle: "À la carte adds up fast",
      alaCarteA: "A single flagship website already reflects a ",
      alaCarteAmount: "$2,000",
      alaCarteB:
        " investment. Layer design-only, a rebrand, or follow-on pages and you're past the cost of several months of ",
      alaCarteProduct: "MenteMaestra Unlimited",
      alaCarteC:
        "—with none of the flexibility. Subscription is built for teams that want velocity without re-scoping every ask.",
      alaCarteHint: "Prefer one deliverable? The project table is yours. Not sure? ",
      alaCarteHintBold: "Start a month, ship the backlog, then pause.",
      websitesTitle: "Websites (project-based)",
      websitesIntro: "A complete site typically ships in ~6 weeks:",
      websitesWeeks: [
        "Weeks 1–2 — Research, strategy, Figma",
        "Weeks 3–4 — Development & implementation",
        "Weeks 5–6 — Testing, CMS, deployment, revisions",
      ],
      subColumnTitle: "Subscription (on-demand)",
      subBullets: [
        "Request anything: sites, brand, content, social.",
        "Delivered in 1–3 days per task (complexity-dependent).",
        "Pause anytime — no contracts or minimums.",
        "Perfect for a focused month of output, then a clean break.",
      ],
      howToChoose: "How to choose",
      howToChooseItems: [
        "One clear outcome (site or brand)? → Book a project.",
        "Multiple lanes or ongoing work? → Go unlimited.",
        "Still deciding? → Subscribe one month, then pause.",
      ],
      hostingTitle: "Hosting & maintenance ",
      hostingOptional: "(optional)",
      hostingBullets: [
        "Included during initial delivery.",
        "Renewal: $500/year — uptime, hosting, and security essentials.",
      ],
      talkScope: "Talk through scope",
      faqTitle: "",
      faqTitleAccent: "FAQ",
      faqSubtitle:
        "Everything you need to decide between a scoped project and on-demand partnership.",
      faq: [
        {
          id: "project-vs-sub",
          q: "When should I choose a one-time project vs. the subscription?",
          a: "Pick a project when you have one focused outcome—a new site, a rebrand, or a build-only phase. Choose MenteMaestra Unlimited when you want volume, variety, or ongoing creative without negotiating every scope. Many teams subscribe for one heavy month, ship a backlog, then pause.",
        },
        {
          id: "timeline",
          q: "How long does a full website take on the project track?",
          a: "Most full sites run about six weeks: weeks 1–2 for research, strategy, and Figma; weeks 3–4 for build; weeks 5–6 for QA, CMS, deployment, and revisions. You get up to two revision rounds on design and two on the live site—most clients don’t need all of them.",
        },
        {
          id: "revisions",
          q: "What counts as a revision?",
          a: "Revisions are structured feedback rounds on the same direction—not unlimited experiments. On projects, we include two design rounds (Figma) and two on the finished site so you can refine with confidence. On subscription, iteration is continuous within each task’s 1–3 day window.",
        },
        {
          id: "pause",
          q: "Can I pause or cancel the subscription?",
          a: "Yes. Pause when you’re not shipping, cancel when you’re done—no lock-in. Use a month to clear a backlog, then step back until the next sprint.",
        },
        {
          id: "hosting",
          q: "Is hosting included? What about maintenance?",
          a: "Hosting is covered during initial delivery. After launch, optional renewal is $500/year for uptime, hosting, and security basics—so you’re not juggling vendors unless you want to.",
        },
        {
          id: "billing",
          q: "Do you invoice in USD, CLP, or both?",
          a: "We show both for transparency. Final invoicing matches your agreement—if you need Chilean billing or tax docs, we’ll align in onboarding.",
        },
      ],
      usdAmounts: ["$1,000", "$1,800", "$2,000", "$1,800"],
      clpAmounts: ["$860,000", "$1,500,000", "$1,800,000", "$1,500,000"],
    },
    book: {
      section: {
        eyebrow: "Get to know us",
        title: "Book an exploratory call",
        subtitle:
          "Pick a date and slot. On the next screen you will add your details and confirm the meeting.",
        qualificationTitle: "Before you book",
        idealForLabel: "Ideal for",
        idealFor: [
          "Founders in fintech, devtools, or services with validated or launching product.",
          "Teams that need brand clarity and a site that converts.",
          "Budgets from ~$2,000 USD (Launch Website) or an ongoing retainer.",
        ],
        typicalLabel: "Typical projects",
        typicalProjects: [
          "Brand Sprint — positioning, narrative, and visual system.",
          "Launch Website — conversion-focused launch site.",
          "Design Partner — ongoing design and product retainer (limited capacity).",
        ],
        notForLabel: "Probably not a match",
        notFor:
          "if you need one-off tasks, low-budget freelance, or a ticket-style unlimited subscription.",
      },
      meeting: {
        cardTitle: "Book your appointment",
        selectPrompt: "Select a date and time for your meeting.",
        summaryLead: "Your exploratory meeting would be on",
        summaryAt: "at",
        continue: "Continue",
        noSlotsForDay:
          "No open times on this day. Try another date.",
        availabilityDbWarning:
          "Database not connected—open times may not reflect real bookings. Set DATABASE_URL on the server.",
        availabilityDbQueryFailed:
          "DATABASE_URL is set but we could not load bookings from the database. On Supabase use the transaction pooler with pgbouncer=true (port 6543), ensure sslmode=require, URL-encode the password, and run migration 001_bookings.sql on this project.",
        availabilityCaldavWarning:
          "Could not read your iCloud calendar (CalDAV). Slots follow the site grid; check ICLOUD_* env and server logs.",
      },
      confirm: {
        title: "Confirm your meeting",
        subtitle: "Add your details and anything we should know beforehand.",
        back: "Change date or time",
        slotLabel: "Selected slot",
        name: "Full name",
        email: "Email",
        company: "Company (optional)",
        message: "What should we know? (optional)",
        submit: "Confirm exploratory meeting",
        submitting: "Sending…",
        successTitle: "You are all set",
        successBody: "Your meeting is booked.",
        successEmailLine:
          "We sent the details to your inbox (check spam).",
        successNothingConfigured:
          "No email or .ics integration is active yet. We’ll reach out using the details you sent.",
        backHome: "Back to home",
        missingSlot: "Please choose a date and time on the homepage first.",
        error: "Something went wrong. Please try again.",
        slotUnavailable:
          "That time is no longer available. Pick another slot.",
        databaseNotConfigured:
          "Booking is unavailable: DATABASE_URL is not set on the server.",
        organizerNotConfigured:
          "BOOKING_ORGANIZER_EMAIL must be set on the server to send invites.",
        icsBuildFailed:
          "Your booking was saved but the calendar file could not be generated. Contact us with your chosen slot.",
        successEmailNotSentHint:
          "Your booking is saved, but we could not send email: verify your domain in Resend (resend.com/domains) or set RESEND_FROM_EMAIL to an address on a domain you have already verified. You can still download the .ics below.",
        downloadIcs: "Download calendar invite (.ics)",
        addToGoogleCalendar: "Google Calendar",
      },
    },
    footer: {
      titleLine1: "Mente",
      titleLine2: "Maestra",
      designStudioLabel: "DESIGN STUDIO",
      tagline:
        "A design partner for teams that want senior creative execution without the overhead of a full in-house studio.",
      menuTitle: "Menu",
      newsletterTitle: "Newsletter",
      newsletterHint: "Occasional notes on brand identity and craft.",
      subscribe: "Subscribe",
      socialTitle: "Social media",
      support: "Support",
      newsletter:
        "Be the first to get the latest news about trends, inspiration & more",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      privacyNote: "By subscribing, you accept our ",
      privacyLink: "Privacy Policy",
      workInquiry: "Work Inquiry",
      workEmail: "info@mentemaestra.studio",
      workPhone: "+56994621925",
      openPosition: "Open Position",
      job1: "Senior Front-end Developer",
      job2: "UI/UX Designer (Remote)",
      locationTitle: "Santiago, Chile",
      address: "Eliodoro Yáñez 2990, Providencia, Santiago de Chile",
      linksTitle: "Links",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      copyright: "© 2026 MenteMaestra SPA.",
      rights: "All rights reserved",
    },
  },
} as const;

export type Messages = (typeof messages)["es"];

/** Either locale branch — same keys, distinct literal string types. */
export type MessagesByLocale = (typeof messages)[Locale];
