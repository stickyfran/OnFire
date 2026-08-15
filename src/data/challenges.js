// Base de datos de 500 retos y verdades picantes en español argentino
// Nivel 1: Previa / Suave (🌶️) - Romper el hielo, calentando motores, miradas, tragos y tensión.
// Nivel 2: Caliente / Tensión (🔥) - Besos, mordidas, roces, masajes, prendas y preguntas sin filtro.
// Nivel 3: Fuego Total / Extremo (💀) - Chape salvaje, shots del cuerpo, tocamientos atrevidos, desnudarse y fantasías explícitas.

const generateChallenges = () => {
  const list = [];
  let idCounter = 1;

  const add = (level, tipo, texto) => {
    list.push({ id: idCounter++, level, tipo, texto });
  };

  // ==========================================
  // NIVEL 1: PREVIA / SUAVE (🌶️) ~ 165 retos/verdades
  // ==========================================
  const n1 = [
    // Verdades Nivel 1
    ["verdad", "¿Quién de los que están acá te parece el/la más fachero/a o linda/o?"],
    ["verdad", "¿A quién de la ronda le darías un beso si no hubiera consecuencias?"],
    ["verdad", "¿Qué fue lo primero que pensaste cuando viste a {target} por primera vez?"],
    ["verdad", "¿Cuál es tu mayor red flag en una cita o garche?"],
    ["verdad", "¿Te chapaste a alguien de esta previa o ronda alguna vez?"],
    ["verdad", "¿Cuál es tu tipo de persona físicamente? ¿Quién de acá se parece más?"],
    ["verdad", "¿Qué prenda de ropa te parece más sexy en {target}?"],
    ["verdad", "¿Alguna vez tuviste un sueño raro o comprometedor con alguien de acá?"],
    ["verdad", "¿Preferís mañanero o de noche? Justificá tu respuesta mirando a {target}."],
    ["verdad", "¿Cuál es el mejor piropo o chamuyo que te tiraron?"],
    ["verdad", "¿Qué perfume o aroma te vuelve completamente loco/a?"],
    ["verdad", "¿Te gusta que te dominen o dominar en la cama?"],
    ["verdad", "¿Qué es lo más zarpado que hiciste estando medio en pedo?"],
    ["verdad", "¿Cuál es tu lugar favorito para que te den besos?"],
    ["verdad", "¿Qué canción pondrías para armar clima con {target}?"],
    ["verdad", "¿Alguna vez mandaste un mensaje hot al número equivocado?"],
    ["verdad", "¿Quién de la ronda tiene la mirada más seductora o pícara?"],
    ["verdad", "¿Cuál es tu trago favorito para ponerte mimoso/a?"],
    ["verdad", "¿Cuál es el beso más inolvidable que diste en tu vida?"],
    ["verdad", "¿Alguna vez stalkeaste el Instagram de {target}?"],
    ["verdad", "¿Qué apodo hot o tierno te gusta que te digan al oído?"],
    ["verdad", "¿Qué puntuación de facha le das a {target} del 1 al 10?"],
    ["verdad", "¿Alguna vez te gustó la pareja o ex de un amigo/a?"],
    ["verdad", "¿Qué es lo primero que le mirás a una persona cuando entra a un lugar?"],
    ["verdad", "¿Tendrías una cita a ciegas con {target}?"],
    ["verdad", "¿Sos de dar besos con lengua largos o cortitos y apasionados?"],
    ["verdad", "¿Cuál es tu mayor fetiche 'inofensivo'?"],
    ["verdad", "¿Preferís luz prendida, apagada o luces tenues neón?"],
    ["verdad", "¿Alguna vez te hiciste el dormido/a para que te abracen o te mimen?"],
    ["verdad", "¿Quién de los presentes te parece el más misterioso/a?"],
    ["verdad", "¿Alguna vez mandaste un nudes que después te arrepentiste?"],
    ["verdad", "¿Qué trago le invitarías a {target} en un boliche para encarar?"],
    ["verdad", "¿Te gusta que te tiren del pelo suavemente mientras te besan?"],
    ["verdad", "¿Cuál es la mentira más chamuyera que metiste para levantarte a alguien?"],
    ["verdad", "¿Qué pensás que es lo más atractivo de tu personalidad?"],
    ["verdad", "¿Te animarías a bailar lento y pegado con {target}?"],
    ["verdad", "¿Alguna vez chapaste con alguien solo por no quedar afuera en un juego?"],
    ["verdad", "¿Cuál es tu posición favorita para dormir abrazado/a?"],
    ["verdad", "¿Qué parte de la cara de {target} te llama más la atención?"],
    ["verdad", "¿Cuál fue tu peor cita y por qué?"],
    ["verdad", "¿Te gusta el juego previo largo o ir directo a los bifes?"],
    ["verdad", "¿Alguna vez le tiraste onda a alguien por mejores amigos de Instagram?"],
    ["verdad", "¿Qué harías si {target} te invita a su casa a ver Netflix a las 3 AM?"],
    ["verdad", "¿Qué es lo que más te calienta en los primeros 5 minutos de chape?"],
    ["verdad", "¿Alguna vez tuviste ganas de darle un pico a alguien de esta ronda?"],
    ["verdad", "¿Cuál es tu debilidad cuando te están encarando?"],
    ["verdad", "¿Qué persona de acá creés que besa mejor?"],
    ["verdad", "¿Alguna vez te descubrieron tus viejos en una situación comprometedora?"],
    ["verdad", "¿Quién tiene más cara de santo/a pero es terrible diablo/a?"],
    ["verdad", "¿Qué impresión te da {target}: tímido/a o atrevido/a?"],
    
    // Retos Nivel 1
    ["reto", "Mirale fijo a los ojos a {target} a 10cm durante 15 segundos sin reírte."],
    ["reto", "Dale un beso tierno en la mejilla a {target} que dure al menos 5 segundos."],
    ["reto", "Tirale tu mejor frase de levante o chamuyo al oído a {target}."],
    ["reto", "Tomate un trago haciendo fondo blanco mirando a {target}."],
    ["reto", "Hacé un brindis sexy dedicándole unas palabras a {target}."],
    ["reto", "Acariciale el pelo a {target} suavemente durante 20 segundos."],
    ["reto", "Chocale los cinco a {target}, pero entrelazando los dedos de forma sensual."],
    ["reto", "Decile tres cosas que te llamen la atención del físico de {target}."],
    ["reto", "Mandale un fueguito 🔥 a la última historia de Instagram de {target}."],
    ["reto", "Hacé contacto visual con {target} mientras tomás un trago de tu vaso."],
    ["reto", "Dejá que {target} te peine o te acomode la ropa."],
    ["reto", "Bailá 15 segundos el tema que esté sonando frente a {target}."],
    ["reto", "Susurrale al oído a {target} tu trago o comida favorita."],
    ["reto", "Dale un abrazo largo y apretado de 10 segundos a {target}."],
    ["reto", "Hacé un choque de copas con {target} y tómense un sorbo cruzando los brazos."],
    ["reto", "Garále la mano a {target} y no la sueltes durante las próximas 2 rondas."],
    ["reto", "Tirale un piropo zarpado pero con clase a {target}."],
    ["reto", "Dejá que {target} elija el próximo tema musical para la previa."],
    ["reto", "Mostrale a {target} la foto más vergonzosa que tengas en tu galería."],
    ["reto", "Hacé una pose de modelo seductor/a y que {target} te saque una foto."],
    ["reto", "Imitá la risa o forma de hablar de {target} hasta que adivinen."],
    ["reto", "Decile al oído a {target} qué puntaje le ponés a su outfit de hoy."],
    ["reto", "Tomá un sorbo del vaso de {target}."],
    ["reto", "Hacé un duelo de miradas con {target}; el primero que parpadee toma 2 tragos."],
    ["reto", "Acomodale el cuello de la remera o campera a {target} bien de cerca."],
    ["reto", "Hacé 5 flexiones o sentadillas mientras mirás a {target}."],
    ["reto", "Contá un secreto vergonzoso de tu última joda o tomá 2 tragos."],
    ["reto", "Escribile con el dedo una palabra secreta en la palma de la mano a {target}."],
    ["reto", "Dejá que {target} te dibuje algo chiquito en el brazo con lapicera."],
    ["reto", "Hacé un bailecito lento con {target} durante 20 segundos."],
    ["reto", "Decile a {target} cuál de sus amigos/as te parece lindo/a."],
    ["reto", "Garále el mentón suavemente a {target} y mirale los labios por 10 segundos."],
    ["reto", "Olé el perfume de {target} en su cuello y decí qué nota le das."],
    ["reto", "Prestale tu campera o buzo a {target} por el resto de la previa."],
    ["reto", "Chochá los hombros con {target} y quédense pegados por 1 ronda."],
    ["reto", "Fingí que estás en una primera cita romántica con {target} por 30 segundos."],
    ["reto", "Decí en voz alta qué te gustaría que pase esta noche."],
    ["reto", "Dejá que {target} te revise las últimas 3 fotos de tu carrete."],
    ["reto", "Dale un piquito en la frente a {target}."],
    ["reto", "Servile el trago a {target} como si fueras su bartender personal."],
    ["reto", "Recreá una escena de novela dramática declarándole tu amor a {target}."],
    ["reto", "Tocale las manos a {target} y decí si las tiene frías o calientes."],
    ["reto", "Mandá un sticker random al grupo de WhatsApp de la previa."],
    ["reto", "Elegí a alguien para que tome 2 tragos junto con vos."],
    ["reto", "Hacé una mueca sexy para que {target} califique tu sensualidad."],
    ["reto", "Decile a {target} cuál es su mejor cualidad según vos."],
    ["reto", "Comé una papa frita o snack compartiéndolo de una punta con {target}."],
    ["reto", "Dejá que {target} te acomode el pelo como más le guste."],
    ["reto", "Hacé como si fueras un/a modelo de pasarela frente a la ronda."],
    ["reto", "Brindá por la persona que más te calienta de la previa."]
  ];

  // ==========================================
  // NIVEL 2: CALIENTE / TENSIÓN (🔥) ~ 170 retos/verdades
  // ==========================================
  const n2 = [
    // Verdades Nivel 2
    ["verdad", "¿Qué parte del cuerpo te excita más que te toquen despacio?"],
    ["verdad", "¿Alguna vez te calentaste con alguien estando de novio/a?"],
    ["verdad", "¿Qué posición es tu debilidad absoluta en la cama?"],
    ["verdad", "¿Alguna vez chapaste con más de 2 personas en la misma noche?"],
    ["verdad", "¿Cuál es tu récord de tiempo en el delicioso?"],
    ["verdad", "¿Te gusta que te muerdan los labios o el cuello mientras te besan?"],
    ["verdad", "¿Alguna vez hiciste algo zarpado en un auto o taxi?"],
    ["verdad", "¿Qué es lo que más te atrae sexualmente de {target}?"],
    ["verdad", "¿Sos de mandar fotos o videos hot seguido?"],
    ["verdad", "¿Alguna vez te chapaste a alguien y al otro día no te acordabas?"],
    ["verdad", "¿Qué ruidos o palabras te calientan escuchar en la intimidad?"],
    ["verdad", "¿Te animarías a hacer un trío? ¿Con quién de acá sumarías?"],
    ["verdad", "¿Cuál fue el lugar más público o arriesgado donde tuviste relaciones?"],
    ["verdad", "¿Alguna vez tuviste un amigo/a con derechos que se terminó complicando?"],
    ["verdad", "¿Qué fetiche te gustaría probar pero te da un poco de vergüenza admitir?"],
    ["verdad", "¿Alguna vez fingiste un orgasmo? Contá cómo fue o tomá 3 tragos."],
    ["verdad", "¿Qué lencería o prenda íntima te parece más provocativa?"],
    ["verdad", "¿Te gusta que te agarren fuerte de la cintura o de la cadera al chapar?"],
    ["verdad", "¿Alguna vez tuviste ganas de besar a {target} en una fiesta?"],
    ["verdad", "¿Qué apodo hot te excita que te digan al oído en pleno acto?"],
    ["verdad", "¿Preferís hacerlo salvaje y rápido o lento y romántico?"],
    ["verdad", "¿Cuál fue tu experiencia sexual más bizarra o divertida?"],
    ["verdad", "¿Alguna vez te grabaste o te sacaste fotos hot frente al espejo?"],
    ["verdad", "¿Qué es lo que nunca perdonarías en la cama?"],
    ["verdad", "¿Alguna vez tuviste onda con alguien mucho mayor o menor que vos?"],
    ["verdad", "¿Qué porcentaje de ganas le tenés a {target} ahora mismo?"],
    ["verdad", "¿Te gusta que te hablen sucio al oído?"],
    ["verdad", "¿Alguna vez tuviste una fantasía en la ducha o jacuzzi?"],
    ["verdad", "¿Qué opinás del mañanero con resaca?"],
    ["verdad", "¿Te calentaría ver a dos personas de acá dándose un beso?"],
    ["verdad", "¿Alguna vez te quedaste con las ganas de encarar a {target}?"],
    ["verdad", "¿Cuál es tu zona erógena más sensible que casi nadie conoce?"],
    ["verdad", "¿Alguna vez tuviste un sueño erótico con la pareja de un amigo/a?"],
    ["verdad", "¿Qué juguete o accesorio te llama la atención probar?"],
    ["verdad", "¿Cuál es tu mayor fantasía en un boliche o fiesta privada?"],
    ["verdad", "¿Qué harías si te quedás encerrado/a en una pieza con {target}?"],
    ["verdad", "¿Alguna vez hiciste el delicioso con música de fondo? ¿Qué tema?"],
    ["verdad", "¿Te gusta que te miren fijo a los ojos mientras están en el acto?"],
    ["verdad", "¿Cuál es la propuesta más indecente que te hicieron en una joda?"],
    ["verdad", "¿Tendrías algo casual esta misma noche con alguien de acá?"],

    // Retos Nivel 2
    ["reto", "Mordele suavemente el labio inferior a {target}."],
    ["reto", "Dale un beso caliente y despacio en el cuello a {target}."],
    ["reto", "Sentate a upa / en las piernas de {target} hasta el próximo turno."],
    ["reto", "Hacele un masaje suave en los hombros y cuello a {target} por 30 segundos."],
    ["reto", "Susurrale al oído algo bien picante o atrevido a {target}."],
    ["reto", "Pegale una nalgada con la fuerza que elija {target}."],
    ["reto", "Pasale un hielo (o tus labios húmedos) por el cuello o clavícula a {target}."],
    ["reto", "Sacate una prenda de ropa (que no sea calzado ni accesorios) o tomá 3 tragos."],
    ["reto", "Meté tu mano en el bolsillo del pantalón de {target} por 20 segundos."],
    ["reto", "Dejá que {target} te dé un beso en el cuello donde quiera."],
    ["reto", "Bailale pegado/a y lento a {target} durante 30 segundos."],
    ["reto", "Desabrochale un botón de la camisa o remera a {target}."],
    ["reto", "Dale un beso en la comisura de los labios a {target}."],
    ["reto", "Pasale la yema de los dedos por la espalda a {target} por debajo de la remera."],
    ["reto", "Hacé que {target} te susurre una fantasía al oído y reaccioná con tu cara."],
    ["reto", "Tomá un sorbo de trago directamente de la boca o labios de {target}."],
    ["reto", "Abrazá a {target} por la espalda y respirale suave en la oreja por 15 segundos."],
    ["reto", "Acariciale los muslos a {target} por arriba del pantalón."],
    ["reto", "Dejá que {target} te muerda suavemente la oreja."],
    ["reto", "Mordé despacito el lóbulo de la oreja de {target}."],
    ["reto", "Dale un beso de 5 segundos en el abdomen o panza a {target}."],
    ["reto", "Sentate en el piso entre las piernas de {target} por 2 rondas."],
    ["reto", "Dejá que {target} te desabroche el cinturón o te acomode la ropa."],
    ["reto", "Hacé que {target} te agarre fuerte de la cintura mientras se miran fijamente."],
    ["reto", "Pasale un cubito de hielo por los labios a {target} y después comételo."],
    ["reto", "Dale un beso en la clavícula a {target} con los ojos cerrados."],
    ["reto", "Quitale una prenda a {target} usando solo una mano."],
    ["reto", "Hacé gemir de mentira a {target} haciéndole cosquillas sensuales."],
    ["reto", "Mirale los labios a {target} y decile qué le harías si estuvieran solos."],
    ["reto", "Dejá que {target} apoye sus manos en tus caderas por 1 ronda."],
    ["reto", "Dale un beso en la nuca a {target} levantándole el pelo."],
    ["reto", "Apoyá tu cabeza en el pecho de {target} y escuchale los latidos 20 segundos."],
    ["reto", "Comé una fruta o snack de la mano de {target} de forma sensual."],
    ["reto", "Acariciale la cintura a {target} por debajo de la remera."],
    ["reto", "Decile al oído a {target} qué ropa interior tenés puesta."],
    ["reto", "Intercambiá una prenda de ropa con {target} por el resto de la previa."],
    ["reto", "Dale un pico a {target} que dure al menos 3 segundos."],
    ["reto", "Dejá que {target} te dé un beso en la mejilla pero bien cerca de la boca."],
    ["reto", "Tomate 2 tragos seguidos apoyado/a contra el pecho de {target}."],
    ["reto", "Hacé un perreo corto y pegado frente a {target}."]
  ];

  // ==========================================
  // NIVEL 3: FUEGO TOTAL / EXTREMO (💀) ~ 165 retos/verdades
  // ==========================================
  const n3 = [
    // Verdades Nivel 3
    ["verdad", "¿Qué es lo más zarpado, prohibido o extremo que hiciste en la cama?"],
    ["verdad", "¿Cuál es tu fantasía erótica más oscura e inconfesable?"],
    ["verdad", "Si tuvieras que tener una noche de pasión con alguien de esta ronda, ¿a quién elegís ya mismo?"],
    ["verdad", "¿Alguna vez hiciste el delicioso en un lugar donde los podían descubrir en cualquier momento?"],
    ["verdad", "¿Cuál es la posición donde más rápido llegás al orgasmo?"],
    ["verdad", "¿Qué fetiche extremo tenés que nunca le contaste a nadie?"],
    ["verdad", "¿Alguna vez te grabaste teniendo relaciones o te gustaría hacerlo?"],
    ["verdad", "¿Qué parte íntima te gusta más que te besen o acaricien?"],
    ["verdad", "¿Alguna vez tuviste un garche tan bueno que no pudiste olvidar a la persona?"],
    ["verdad", "¿Qué harías con {target} en una cama con sábanas de seda y luces rojas?"],
    ["verdad", "¿Alguna vez probaste bondage, esposas o vendarle los ojos a alguien?"],
    ["verdad", "¿Te gusta dominar, ser dominado/a o un 50/50 salvaje?"],
    ["verdad", "¿Cuál es tu récord de mañaneros o rounds en un solo día?"],
    ["verdad", "¿Alguna vez mandaste un video masturbándote a alguien?"],
    ["verdad", "¿Te calienta que te toquen por debajo de la mesa en lugares públicos?"],
    ["verdad", "¿Qué es lo más sucio que te dijeron al oído y te prendió fuego?"],
    ["verdad", "¿Tuviste alguna vez una experiencia con alguien de tu mismo sexo o te daría curiosidad?"],
    ["verdad", "¿Cuál es tu juguete erótico favorito o cuál te morís por probar?"],
    ["verdad", "¿Alguna vez hiciste sexting zarpado mientras estabas en horario de laburo o facultad?"],
    ["verdad", "¿Qué prenda te sacarías primero si te quedás a solas con {target}?"],
    ["verdad", "¿Qué es lo más fuerte que le harías a {target} si te diera permiso total?"],
    ["verdad", "¿Alguna vez hiciste un trío o cuarteto? Si no, ¿con quiénes de acá te animarías?"],
    ["verdad", "¿Sos de gemir fuerte o preferís morder la almohada/labio?"],
    ["verdad", "¿Te gusta el sexo rudo con agarre de pelo y nalgadas o caricias lentas?"],
    ["verdad", "¿Alguna vez tuviste relaciones en el baño de un boliche o fiesta?"],
    ["verdad", "¿Qué te parece lo más excitante de {target} en una escala del 1 al 10?"],
    ["verdad", "¿Cuál es tu lugar prohibido soñado para tener relaciones?"],
    ["verdad", "¿Alguna vez tuviste sexo en la casa de los padres de tu pareja estando ellos ahí?"],
    ["verdad", "¿Te gustaría que {target} te ate las manos a la cama?"],
    ["verdad", "¿Cuál es la propuesta sexual más loca que aceptaste en tu vida?"],

    // Retos Nivel 3
    ["reto", "Pegale un chape salvaje de 10 segundos con lengua a {target}."],
    ["reto", "Tomate un shot o trago directamente del cuerpo o cuello de {target}."],
    ["reto", "Sacate dos prendas de ropa o clavate 4 tragos de fondo blanco."],
    ["reto", "Dale un beso donde {target} te pida (incluyendo labios, cuello o abdomen)."],
    ["reto", "Hacele un striptease o baile erótico de 20 segundos a {target} a 10cm."],
    ["reto", "Pasale la lengua por el cuello a {target} desde la clavícula hasta la oreja."],
    ["reto", "Dejá que {target} te meta la mano por debajo de la remera y te acaricie."],
    ["reto", "Meté tu mano por debajo de la remera de {target} y acariciale la espalda o abdomen."],
    ["reto", "Dale una nalgada fuerte a {target} y decile qué bien se sintió."],
    ["reto", "Mordele el cuello con pasión a {target}."],
    ["reto", "Tirate en el sillón/piso y dejá que {target} se suba encima tuyo por 20 segundos."],
    ["reto", "Besale el abdomen o panza a {target} levantándole la remera con la boca."],
    ["reto", "Dejá que {target} te muerda los labios con fuerza y pasión."],
    ["reto", "Tomá un trago de la boca de {target} pasándoselo de boca a boca."],
    ["reto", "Chupale un dedo de la mano a {target} mirándolo/a fijo a los ojos."],
    ["reto", "Sentate a upa de {target} y chapátelo/a durante 10 segundos."],
    ["reto", "Sacale una prenda con los dientes a {target} sin usar las manos."],
    ["reto", "Hacé que {target} te apoye la boca en el cuello y te respire caliente por 20s."],
    ["reto", "Dale un beso con lengua de 15 segundos a {target} con las manos en su cintura."],
    ["reto", "Dejá que {target} te dé una nalgada con ganas."],
    ["reto", "Pasale un hielo por el pecho/pecho a {target} por debajo de la ropa."],
    ["reto", "Susurrale con voz ronca a {target} exactamente qué le harías en la cama."],
    ["reto", "Besale la parte interna del muslo a {target} cerca de la ingle."],
    ["reto", "Hacé que {target} te agarre del pelo y te dé un beso apasionado."],
    ["reto", "Quedate en ropa interior superior o sacate la remera hasta el final de la ronda."],
    ["reto", "Comé algo dulce o tomá alcohol directamente del ombligo de {target}."],
    ["reto", "Abrazá a {target} cuerpo a cuerpo y hacé fricción sensual por 15 segundos."],
    ["reto", "Dejá que {target} te vende los ojos y te bese en tres partes del cuerpo que elija."],
    ["reto", "Dale un beso apasionado a {target} y tocale la cola con las dos manos."],
    ["reto", "Cerrá los ojos y dejá que {target} te pase los labios por donde quiera sin avisar."]
  ];

  // Poblar hasta ~500 items intercalando templates y variantes
  const expandPool = (baseArray, targetCount, level) => {
    let count = 0;
    while (list.filter(x => x.level === level).length < targetCount) {
      const item = baseArray[count % baseArray.length];
      const tipo = item[0];
      let texto = item[1];
      
      // Si ya agregamos el original, generar variaciones contextuales
      if (count >= baseArray.length) {
        const loop = Math.floor(count / baseArray.length);
        const suffixes = [
          " (sin titubear, dale)",
          " (o clavate 2 tragos si te da vergüenza)",
          " (mirando fijo a los ojos)",
          " (con toda la actitud)",
          " (o que el grupo elija un castigo)",
          " (sin filtro)",
          " (y que todos opinen)",
          " (a fondo)"
        ];
        texto = texto + suffixes[loop % suffixes.length];
      }

      add(level, tipo, texto);
      count++;
    }
  };

  expandPool(n1, 165, 1);
  expandPool(n2, 170, 2);
  expandPool(n3, 165, 3);

  return list;
};

export const ALL_CHALLENGES = generateChallenges();
