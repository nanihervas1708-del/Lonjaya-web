/**
 * Contenido de las páginas legales, en Markdown. Se renderiza con la
 * librería "marked" en LegalPageView. IMPORTANTE: revisa y completa el CIF
 * pendiente en el Aviso Legal antes de considerar esto publicable de verdad,
 * y haz que un abogado revise sobre todo la Política de Devoluciones.
 */

export const LEGAL_DOCS = {
  aviso: {
    title: "Aviso Legal",
    markdown: `# Aviso Legal

## 1. Datos identificativos

En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSICE), se informa de los siguientes datos:

- **Denominación social:** LonjaYa S.L.U.
- **CIF:** [PENDIENTE — dato obligatorio por ley (art. 10 LSSICE); esta página no debe publicarse sin completarlo]
- **Domicilio:** Avda. de México, s/n
- **Contacto:** a través de nuestro [formulario de contacto](#contacto), accesible desde el pie de página
- **Actividad:** Plataforma de marketplace online para la compraventa de pescado, marisco y productos del mar entre compradores y vendedores independientes (lonjas, pescaderías, empresas distribuidoras y tiendas online especializadas).

## 2. Objeto

El presente Aviso Legal regula el acceso y uso del sitio web lonjaya.com (en adelante, "el Sitio Web" o "LonjaYa"), del que es titular LonjaYa S.L.U. (en adelante, "LonjaYa", "nosotros").

La navegación por el Sitio Web atribuye la condición de usuario del mismo (en adelante, "el Usuario") e implica la aceptación plena de todas las condiciones incluidas en este Aviso Legal.

## 3. Naturaleza de la plataforma: LonjaYa como intermediario

Es importante que el Usuario comprenda la naturaleza del servicio prestado por LonjaYa:

- LonjaYa **no vende directamente** pescado ni marisco. LonjaYa es una **plataforma tecnológica de intermediación** que conecta a compradores con vendedores independientes (lonjas, pescaderías, empresas y tiendas especializadas, en adelante "los Vendedores").
- El **contrato de compraventa** de cada producto se formaliza directamente entre el Usuario comprador y el Vendedor correspondiente. LonjaYa no es parte de dicho contrato de compraventa.
- LonjaYa gestiona el cobro del importe total del pedido a través de la pasarela de pago (PayPal) en representación de los Vendedores, y posteriormente liquida a cada Vendedor el importe correspondiente, descontada la comisión de intermediación de la plataforma.
- Cada Vendedor es el **único responsable** de la calidad, seguridad alimentaria, correcto etiquetado, elaboración, envasado, conservación de la cadena de frío hasta la entrega al transportista, y cumplimiento de la normativa sanitaria y alimentaria aplicable a sus productos, incluyendo la posesión del Registro General Sanitario de Empresas Alimentarias y Alimentos (RGSEAA) u otro registro sanitario que le sea exigible por su actividad de manipulación de alimentos.
- LonjaYa dispone de registro sanitario propio para su actividad como plataforma, si bien no manipula físicamente el producto en ningún momento; la manipulación y responsabilidad alimentaria directa corresponde a cada Vendedor.

## 4. Condiciones de acceso y uso

El acceso al Sitio Web es gratuito. El acceso y/o uso de este portal atribuye la condición de Usuario, que acepta, desde dicho acceso y/o uso, las condiciones generales de uso aquí reflejadas.

El Usuario se compromete a hacer un uso adecuado de los contenidos y servicios que LonjaYa ofrece y a no emplearlos para: incurrir en actividades ilícitas o contrarias a la buena fe y al ordenamiento legal; provocar daños en los sistemas físicos y lógicos de LonjaYa, de sus proveedores o de terceras personas; introducir o difundir virus informáticos o cualesquiera otros sistemas físicos o lógicos que sean susceptibles de provocar los daños anteriormente mencionados.

## 5. Propiedad intelectual e industrial

Todos los contenidos del Sitio Web (textos, fotografías, gráficos, imágenes, iconos, tecnología, software, diseño gráfico, marca "LonjaYa", así como su estructura, selección y ordenación) están protegidos por derechos de propiedad intelectual e industrial titularidad de LonjaYa o de terceros que han autorizado su uso.

Quedan expresamente prohibidas la reproducción, distribución y comunicación pública del contenido de este Sitio Web con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización de LonjaYa.

Las fotografías de productos publicadas por cada Vendedor son responsabilidad y, salvo indicación en contrario, propiedad de dicho Vendedor.

## 6. Exclusión de garantías y responsabilidad

LonjaYa no garantiza la disponibilidad y continuidad del funcionamiento del Sitio Web. Cuando ello sea razonablemente posible, LonjaYa advertirá con antelación de las interrupciones en el funcionamiento del Sitio Web.

LonjaYa no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de la falta de disponibilidad o de continuidad del funcionamiento del Sitio Web. En cuanto a la calidad, estado, conservación, elaboración o entrega de los productos vendidos por los Vendedores, se estará a lo dispuesto en la Política de Devoluciones y Reclamaciones.

## 7. Legislación aplicable y jurisdicción

Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someterán a los Juzgados y Tribunales del domicilio del Usuario consumidor, cuando la legislación aplicable así lo permita, o en su defecto a los que correspondan conforme a derecho.

Los consumidores y usuarios también pueden acudir a la plataforma de resolución de litigios en línea de la Unión Europea: https://ec.europa.eu/consumers/odr

---

*Última actualización: [fecha de publicación]*
`,
  },
  privacidad: {
    title: "Política de Privacidad",
    markdown: `# Política de Privacidad

## 1. Responsable del tratamiento

- **Responsable:** LonjaYa S.L.U.
- **CIF:** [PENDIENTE — completar antes de publicar]
- **Domicilio:** Avda. de México, s/n
- **Contacto para protección de datos:** a través de nuestro [formulario de contacto](#contacto), accesible desde el pie de página

## 2. Datos que recogemos

Según cómo uses LonjaYa, tratamos los siguientes datos:

**Si compras:**
- Nombre, email, dirección de entrega, ciudad y código postal (para gestionar tu pedido y entregártelo)
- Rango de edad, únicamente si decides indicarlo de forma voluntaria y opcional al finalizar la compra
- Datos de pago: **no los almacenamos nosotros en ningún momento**; los gestiona directamente PayPal, conforme a su propia política de privacidad

**Si vendes (Vendedor):**
- Email y contraseña de tu cuenta (gestionados de forma segura por nuestro proveedor de autenticación, Supabase)
- Nombre de tu negocio, ubicación, descripción y datos de contacto que tú mismo facilites
- Datos de tus ventas, comisiones y liquidaciones

**Para cualquier visitante:**
- Datos de navegación con fines estadísticos: páginas vistas, productos consultados, términos de búsqueda, duración aproximada de la visita, y ubicación geográfica aproximada (a nivel de ciudad/país, obtenida por dirección IP, nunca tu ubicación exacta). No usamos cookies de rastreo de terceros para esto — es analítica propia.

## 3. Finalidad y base legal del tratamiento

| Finalidad | Base legal |
|---|---|
| Gestionar y entregar tu pedido | Ejecución de un contrato (art. 6.1.b RGPD) |
| Gestionar tu cuenta de vendedor | Ejecución de un contrato (art. 6.1.b RGPD) |
| Enviarte confirmaciones y avisos sobre tus pedidos | Ejecución de un contrato (art. 6.1.b RGPD) |
| Analítica de uso de la web (visitas, productos vistos, búsquedas) | Interés legítimo (art. 6.1.f RGPD) |
| Cumplir obligaciones fiscales y contables | Obligación legal (art. 6.1.c RGPD) |

No utilizamos tus datos para elaborar perfiles con fines publicitarios ni los cedemos a terceros para marketing.

## 4. Destinatarios de los datos

Para prestar el servicio, compartimos los datos estrictamente necesarios con:

- **El Vendedor** de cada producto que compres, para que pueda preparar y enviar tu pedido (nombre, dirección de entrega, productos comprados)
- **PayPal**, como pasarela de pago, para procesar el cobro
- **Supabase** (base de datos y autenticación) y **Netlify** (alojamiento web), como encargados del tratamiento, ambos con servidores dentro de la Unión Europea o acogidos a garantías adecuadas de transferencia internacional
- **Resend**, para el envío de emails transaccionales (confirmaciones de pedido, avisos)
- La Administración, cuando exista obligación legal de hacerlo

No vendemos tus datos a terceros bajo ningún concepto.

## 5. Conservación de los datos

Conservaremos tus datos mientras mantengas una cuenta activa o mientras sea necesario para cumplir con las obligaciones legales aplicables (por ejemplo, la normativa fiscal exige conservar los datos de facturación durante los plazos legalmente establecidos, actualmente 4-6 años según el tipo de obligación).

## 6. Tus derechos

Puedes ejercer en cualquier momento tus derechos de **acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad** de tus datos, a través de nuestro formulario de contacto (accesible desde el pie de página), indicando el derecho que deseas ejercer junto con una copia de tu documento identificativo.

También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras que el tratamiento de tus datos no se ajusta a la normativa.

## 7. Seguridad

Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos, incluyendo cifrado de las comunicaciones (HTTPS), contraseñas cifradas y control de acceso restringido a la información.

---

*Última actualización: [fecha de publicación]*
`,
  },
  cookies: {
    title: "Política de Cookies",
    markdown: `# Política de Cookies

## 1. Qué son las cookies

Una cookie es un pequeño archivo que se almacena en tu dispositivo cuando visitas una web, y que permite recordar información sobre tu visita.

## 2. Cookies y tecnologías similares que usamos

LonjaYa utiliza un enfoque minimalista: **no usamos cookies de publicidad ni de seguimiento de terceros**. Lo que sí utilizamos es:

| Nombre | Tipo | Finalidad | Duración |
|---|---|---|---|
| Sesión de autenticación (Supabase) | Técnica, propia | Mantener iniciada tu sesión si eres vendedor o administrador | Hasta que cierres sesión o caduque |
| Identificador de sesión anónimo | Técnica, propia | Analítica interna (agrupar tus visitas a la web durante esa sesión, sin identificarte) | Mientras dure la sesión del navegador |
| Carrito de la compra | Técnica, propia | Recordar los productos añadidos a tu cesta | Persistente hasta que la vacíes o completes la compra |
| Cookies de PayPal | De terceros, necesaria | Procesar el pago de forma segura durante el checkout | Según política de PayPal |

## 3. Base legal

Las cookies técnicas y necesarias para el funcionamiento básico del Sitio Web (como el carrito de la compra o mantener tu sesión iniciada) **no requieren tu consentimiento previo**, conforme al artículo 22.2 de la LSSICE, ya que son estrictamente necesarias para prestar el servicio que solicitas.

La analítica que usamos es propia (no de terceros como Google Analytics), se basa en interés legítimo, y no permite identificarte personalmente.

## 4. Cómo desactivar las cookies

Puedes configurar tu navegador para rechazar cookies o para que te avise antes de aceptarlas. Ten en cuenta que si desactivas las cookies técnicas necesarias (como la del carrito), es posible que algunas funciones de la web —como añadir productos a la cesta— dejen de funcionar correctamente.

La forma de hacerlo varía según el navegador:
- **Chrome:** Configuración → Privacidad y seguridad → Cookies
- **Firefox:** Opciones → Privacidad y seguridad
- **Safari:** Preferencias → Privacidad
- **Edge:** Configuración → Cookies y permisos del sitio

---

*Última actualización: [fecha de publicación]*
`,
  },
  condiciones: {
    title: "Condiciones de Venta",
    markdown: `# Condiciones de Venta

## 1. Objeto y aceptación

Las presentes Condiciones de Venta regulan la compra de productos a través de lonjaya.com, plataforma titularidad de LonjaYa S.L.U. Al completar un pedido, el Usuario declara ser mayor de edad y aceptar íntegramente estas condiciones.

## 2. LonjaYa como intermediario

LonjaYa es un **marketplace**: pone en contacto a compradores con Vendedores independientes (lonjas, pescaderías, empresas y tiendas online especializadas) que ofrecen sus productos a través de la plataforma.

**El contrato de compraventa de cada producto se celebra directamente entre el comprador y el Vendedor correspondiente.** LonjaYa no fabrica, elabora, envasa ni manipula ningún producto; su papel se limita a:

- Ofrecer el catálogo y facilitar la compra
- Gestionar el cobro del pedido en representación de los Vendedores
- Liquidar a cada Vendedor su parte correspondiente, descontada la comisión de la plataforma
- Facilitar la comunicación entre comprador y Vendedor en caso de incidencias

Cada Vendedor es responsable de la disponibilidad, descripción, precio, calidad, elaboración, envasado y cumplimiento normativo (incluida la normativa sanitaria y de seguridad alimentaria) de los productos que publica.

## 3. Proceso de compra

1. El Usuario selecciona los productos y los añade a la cesta.
2. En el checkout, indica sus datos de entrega y email de contacto.
3. El importe total (productos + gastos de envío) se cobra a través de PayPal en el momento de confirmar el pedido.
4. Tras el pago, el Usuario recibe un email de confirmación, y el/los Vendedor(es) implicados reciben el aviso del pedido para prepararlo.

## 4. Precios y gastos de envío

Los precios mostrados en cada producto incluyen los impuestos aplicables. Los gastos de envío se calculan según el peso total del pedido:

- De 0 a 5 kg: 10 €
- Cada 5 kg adicionales: +4 €, hasta 20 kg

Para pedidos de mayor peso, se aplica el mismo incremento proporcional. El importe exacto se muestra siempre antes de confirmar el pago.

## 5. Forma de pago

El pago se realiza a través de **PayPal**, de forma segura. LonjaYa no almacena en ningún momento los datos de la tarjeta o cuenta de pago del Usuario.

## 6. Derecho de desistimiento

De acuerdo con el artículo 103.d) del Real Decreto Legislativo 1/2007 (Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios), **el derecho de desistimiento de 14 días no es aplicable** a los productos vendidos en LonjaYa, al tratarse de bienes perecederos que pueden deteriorarse o caducar con rapidez (pescado y marisco fresco).

Esto no afecta a los derechos del consumidor en caso de producto defectuoso, dañado en el transporte, o que no se corresponda con lo pedido — ver la Política de Devoluciones y Reclamaciones para esos casos.

## 7. Entrega

Los pedidos se envían mediante empresa de transporte nacional con garantía de cadena de frío y control de temperatura. Los plazos de entrega estimados se indican en el proceso de compra y pueden variar según el Vendedor y la zona de entrega.

## 8. Reclamaciones

Ver la **Política de Devoluciones y Reclamaciones**, que forma parte integrante de estas Condiciones de Venta.

Los usuarios consumidores también pueden acudir a la plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr

## 9. Modificación de las condiciones

LonjaYa podrá modificar estas Condiciones de Venta en cualquier momento. Las condiciones aplicables a cada pedido serán las vigentes en el momento de su confirmación.

---

*Última actualización: [fecha de publicación]*
`,
  },
  devoluciones: {
    title: "Política de Devoluciones y Reclamaciones",
    markdown: `# Política de Devoluciones y Reclamaciones

## 1. Quién es responsable de cada producto

LonjaYa es una plataforma de intermediación: **no elabora, envasa, conserva ni envía ningún producto**. Cada artículo publicado en LonjaYa es preparado, envasado y enviado directamente por el Vendedor que lo vende (la lonja, pescadería, empresa o tienda especializada correspondiente).

Por ello, y como se informa igualmente en el Aviso Legal y en las Condiciones de Venta:

> **El Vendedor que realizó la venta es el responsable de la elaboración, envasado, calidad, conservación y envío del producto, y es quien debe atender y resolver las reclamaciones relativas al estado, calidad o conformidad del producto entregado.**

LonjaYa no participa en la preparación física de ningún pedido y, en consecuencia, no puede responder por defectos, daños o incumplimientos derivados de la actuación de un Vendedor. Esto no excluye que LonjaYa, como plataforma, colabore de buena fe para facilitar la comunicación entre comprador y Vendedor ante cualquier incidencia, tal como se explica en el apartado 4.

## 2. Casos en los que puedes reclamar

Puedes reclamar directamente al Vendedor cuando:

- El producto llega en mal estado, dañado o deteriorado por un problema de envasado o conservación
- El producto recibido no coincide con lo que compraste (cantidad, tipo o referencia incorrecta)
- El producto no llega dentro del plazo de entrega comprometido
- El producto presenta defectos de calidad no acordes con su descripción

Como se indica en las Condiciones de Venta, al tratarse de productos perecederos, **no existe derecho de desistimiento** por simple cambio de opinión (art. 103.d LGDCU); las reclamaciones aquí descritas se refieren a productos defectuosos, dañados o no conformes con el pedido, no a devoluciones voluntarias.

## 3. Cómo reclamar

1. Ponte en contacto con el Vendedor a través de los datos de contacto que aparecen en su ficha dentro de LonjaYa, indicando el número de pedido, el problema concreto y, si es posible, una fotografía del producto recibido.
2. El Vendedor deberá responder y resolver la incidencia (reembolso total o parcial, reposición del producto, u otra solución acordada) en un plazo razonable.
3. Si no obtienes respuesta del Vendedor en un plazo de 5 días naturales, o consideras que la solución ofrecida no es adecuada, puedes escribirnos a través de nuestro formulario de contacto (accesible desde el pie de página), indicando el número de pedido. LonjaYa mediará poniéndose en contacto con el Vendedor implicado para facilitar una solución, sin que ello suponga una asunción de responsabilidad por parte de LonjaYa sobre el producto en cuestión.

## 4. Papel de LonjaYa en las reclamaciones

LonjaYa:

- **No es responsable** de la calidad, conservación, elaboración ni envío de los productos, responsabilidad que corresponde en exclusiva al Vendedor, conforme a lo indicado en el apartado 1.
- **Sí facilita** la mediación entre comprador y Vendedor cuando el comprador no obtiene respuesta satisfactoria, dado que LonjaYa gestiona el cobro del pedido y dispone de los datos de contacto de ambas partes.
- Podrá, a su criterio y sin que constituya obligación ni reconocimiento de responsabilidad, suspender o revisar la actividad de un Vendedor que acumule reclamaciones reiteradas o incumplimientos graves, en aplicación de las condiciones de uso aceptadas por los Vendedores al darse de alta en la plataforma.

## 5. Coste de la devolución y proceso de reclamación

Cuando, conforme al apartado 2, proceda la devolución física de un producto:

- **El coste del reenvío del producto correrá a cargo del comprador**, salvo que una disposición legal imperativa establezca lo contrario para el caso concreto.
- La empresa Vendedora **no tramitará el reembolso ni dará curso a la reclamación hasta que el producto devuelto haya sido recibido y verificado** por su parte.
- Dado que se trata de productos perecederos, en los casos en los que la devolución física del producto no resulte higiénicamente viable o razonable (por su propia naturaleza perecedera), el Vendedor podrá optar por resolver la reclamación mediante evidencia fotográfica del estado del producto en lugar de exigir su devolución física, a su criterio.

**Aviso:** esta cláusula traslada al comprador el coste de la devolución incluso en los casos en que el motivo sea un defecto o no conformidad imputable al Vendedor. La normativa de consumo española (LGDCU) tiende a hacer recaer estos costes sobre el vendedor cuando el fallo es suyo, por lo que esta cláusula conlleva un riesgo real de ser considerada abusiva si un comprador la impugnara. Se recomienda encarecidamente confirmar su validez con un abogado antes de publicarla, y valorar como alternativa más segura limitar esta exigencia a los casos en que el comprador solicite la devolución sin que exista defecto acreditado por parte del Vendedor.

## 6. Reembolsos

Cuando proceda un reembolso (por ejemplo, porque el Vendedor lo acuerda con el comprador, porque se verifica la devolución conforme al apartado 5, o porque un pedido no llega a prepararse), el importe se devuelve por el mismo medio de pago utilizado (PayPal). Los plazos de gestión dependen de la coordinación con el Vendedor y, en su caso, de los plazos propios de PayPal para la devolución.

## 7. Vías de reclamación adicionales

Si consideras que tus derechos como consumidor no han sido respetados, puedes acudir a:

- Las hojas de reclamaciones oficiales, si aplica según tu comunidad autónoma
- La plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr
- Las asociaciones de consumidores y usuarios de tu localidad

---

*Última actualización: [fecha de publicación]*
`,
  },
};