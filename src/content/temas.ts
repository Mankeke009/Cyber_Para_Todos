import {
  MessageSquareWarning, ShieldAlert, LockKeyhole, UserX, MapPin,
  Fish, Bug, KeyRound, Gamepad2, QrCode, type LucideIcon,
} from "lucide-react";

export type Tema = {
  group: string;
  title: string;
  icon: LucideIcon; // ícono de línea; puedes sumar un campo `image` si quieres foto/ilustración
  image?: string; // opcional: ruta en /public (ej. "/temas/ciberacoso.jpg"). Si falta, se muestra el ícono
  imageAlt?: string; // descripción real de la imagen (lectores de pantalla)
  link: string; // URL "más información"
  body: string;
  tips: string[];
  example: string | null;
};

export const temas: Tema[] = [
  {
    group: "Amenazas interpersonales y conductuales",
    title: "Ciberacoso",
    icon: MessageSquareWarning,
    image: "/temas/ciberacoso.webp",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Es hostigar, burlarse, amenazar o difundir contenido ofensivo sobre otra persona a través de internet o redes sociales, de forma repetida.",
    tips: [
      "No respondas ni sigas la conversación: guarda pruebas (capturas de pantalla) y avisa a un adulto de confianza.",
      "Bloquea y reporta al usuario o el contenido dentro de la misma app.",
      "Si ves que le pasa a un compañero, apóyalo y cuéntaselo a un profesor: quedarse callado no ayuda.",
    ],
    example:
      "Ejemplo: un grupo de compañeros crea un chat para burlarse de otro estudiante y comparte capturas humillantes. Eso es ciberacoso, aunque \"sea broma\".",
  },
  {
    group: "Amenazas interpersonales y conductuales",
    title: "Grooming",
    icon: ShieldAlert,
    link: "#",
    image: "/temas/grooming.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    body: "Ocurre cuando una persona adulta se acerca a un niño, niña o adolescente en internet, generalmente ganándose su confianza poco a poco, con la intención de manipularlo o abusar de él.",
    tips: [
      "Ninguna persona adulta desconocida necesita ganarse tu confianza en privado ni pedirte secretos o fotos.",
      "Desconfía de quien te pide mantener la conversación en secreto de tu familia.",
      "Cuéntale de inmediato a un adulto de confianza si alguien te hace sentir incómodo, presionado o confundido en una conversación online.",
    ],
    example:
      "Si una persona que no conoces en la vida real insiste en chatear a solas, te hace regalos virtuales o te pide que no cuentes la conversación, es una señal de alerta.",
  },
  {
    group: "Amenazas interpersonales y conductuales",
    title: "Sexting y difusión no consentida",
    icon: LockKeyhole,
    image: "/temas/sexting.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "El sexting es enviar fotos o videos íntimos por internet. El problema es que, una vez enviados, se pierde el control sobre ellos: pueden reenviarse sin permiso, algo que causa un daño grave y es un delito.",
    tips: [
      "Nunca envíes ni pidas fotos o videos íntimos, aunque te los pida alguien de confianza.",
      "Si recibiste una imagen así, no la reenvíes ni la guardes: díselo a un adulto.",
      "Si te ocurrió a ti, no es tu culpa: pide ayuda a un adulto de confianza de inmediato, hay formas de actuar y proteger tu privacidad.",
    ],
    example: null,
  },
  {
    group: "Amenazas interpersonales y conductuales",
    title: "Suplantación de identidad",
    icon: UserX,
    image: "/temas/suplantaciondeidentidad.jpg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Es cuando alguien crea un perfil falso haciéndose pasar por ti (o por otra persona), o usa tu cuenta sin tu permiso para publicar o hablar en tu nombre.",
    tips: [
      "Usa contraseñas distintas y no las compartas, ni siquiera con amigos.",
      "Activa la verificación en dos pasos en tus cuentas importantes.",
      "Si descubres un perfil falso con tu nombre o fotos, repórtalo en la app y cuéntaselo a un adulto.",
    ],
    example:
      "Ejemplo: alguien crea una cuenta de Instagram con tu foto de perfil y tu nombre, y empieza a escribirle a tus contactos haciéndose pasar por ti.",
  },
  {
    group: "Amenazas interpersonales y conductuales",
    title: "Exposición excesiva de información",
    icon: MapPin,
    image: "/temas/oversharing.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Publicar datos personales, tu ubicación en tiempo real, tus rutinas diarias o muchas fotos puede darle a personas desconocidas información suficiente para ubicarte o conocer tus hábitos.",
    tips: [
      "Revisa la privacidad de tus redes: que solo tus contactos vean lo que publicas.",
      "Evita publicar en el momento en que estás en un lugar; puedes compartirlo después.",
      "No publiques tu dirección, colegio o rutina diaria de forma pública.",
    ],
    example:
      "Ejemplo: publicar una historia \"en vivo\" desde el colegio, todos los días a la misma hora, muestra exactamente dónde estarás y cuándo.",
  },
  {
    group: "Riesgos técnicos y estafas digitales",
    title: "Phishing y mensajes engañosos",
    icon: Fish,
    image: "/temas/phishing.jpg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Son mensajes o correos que se hacen pasar por una empresa o servicio conocido (un banco, un juego, una red social) para que entregues tu contraseña o tus datos personales o bancarios.",
    tips: [
      "Nunca entregues tu contraseña por un link que llegó por correo o WhatsApp.",
      "Si un mensaje te apura o te asusta para que actúes rápido, sospecha.",
      "Revisa que la dirección web sea la oficial antes de iniciar sesión.",
    ],
    example:
      "Ejemplo: llega un correo que dice \"ganaste un premio en Free Fire, ingresa tu usuario y contraseña aquí para reclamarlo\". No es real: buscan robar tu cuenta.",
  },
  {
    group: "Riesgos técnicos y estafas digitales",
    title: "Malware y aplicaciones peligrosas",
    icon: Bug,
    link: "#",
    image: "/temas/malware.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    body: "Son programas o archivos que, al instalarse, dañan tu dispositivo, roban tu información o espían lo que haces, muchas veces disfrazados de una app normal.",
    tips: [
      "Descarga aplicaciones solo desde las tiendas oficiales (Google Play, App Store).",
      "No instales \"mods\", \"hacks\" o versiones gratuitas de apps pagadas que ofrecen páginas desconocidas.",
      "Presta atención si tu dispositivo empieza a andar muy lento o aparecen anuncios raros: puede ser una señal.",
    ],
    example:
      "Ejemplo: una app promete \"vidas infinitas\" en un juego, pero al instalarla empieza a mostrar publicidad invasiva y pide permisos que no necesita.",
  },
  {
    group: "Riesgos técnicos y estafas digitales",
    title: "Robo de cuentas y contraseñas",
    icon: KeyRound,
    image: "/temas/robo.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Es cuando alguien logra entrar sin tu permiso a tu red social, tu correo o tu cuenta de videojuegos, generalmente porque adivinó, robó o compró tu contraseña.",
    tips: [
      "Usa una frase larga como contraseña, distinta en cada cuenta.",
      "Activa la verificación en dos pasos siempre que se pueda.",
      "Si no puedes entrar a tu cuenta o ves actividad que no reconoces, avisa a un adulto y cambia la contraseña desde otro dispositivo.",
    ],
    example:
      "Ejemplo: usar \"123456\" en el correo, el juego y la red social hace que, si roban una contraseña, puedan entrar a todo lo demás.",
  },
  {
    group: "Riesgos técnicos y estafas digitales",
    title: "Estafas en videojuegos y redes sociales",
    icon: Gamepad2,
    link: "#",
    image: "/temas/estafa.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    body: "Son ofertas falsas de premios, monedas o ítems gratis, o ventas de productos que en realidad no existen, diseñadas para que pagues o entregues tus datos.",
    tips: [
      "Desconfía de \"monedas gratis\" o \"skins gratis\" que piden tu usuario y contraseña en una página externa.",
      "No compres a vendedores desconocidos que piden pago por transferencia antes de mostrar el producto.",
      "Consulta con un adulto antes de hacer cualquier compra o intercambio online.",
    ],
    example:
      "Ejemplo: una página promete \"V-Bucks gratis\" en Fortnite si ingresas tu cuenta ahí; en realidad, roban la cuenta.",
  },
  {
    group: "Riesgos técnicos y estafas digitales",
    title: "Enlaces, códigos QR y descargas maliciosas",
    icon: QrCode,
    image: "/temas/quishing.jpeg",
    imageAlt: "Descripción real de lo que muestra la imagen",
    link: "#",
    body: "Un enlace, código QR o archivo puede llevarte a un sitio falso o instalar un programa peligroso sin que te des cuenta, incluso si parece venir de alguien conocido.",
    tips: [
      "No escanees códigos QR de fuentes desconocidas ni hagas clic en links sospechosos, aunque parezcan venir de un amigo.",
      "Si un contacto te envía un link raro o fuera de contexto, pregúntale por otro medio si de verdad lo mandó él.",
      "Antes de descargar un archivo, verifica que venga de una fuente oficial y confiable.",
    ],
    example:
      "Ejemplo: un QR pegado en un afiche del colegio ofrece \"wifi gratis\", pero en realidad lleva a una página que pide tus datos.",
  },
];
