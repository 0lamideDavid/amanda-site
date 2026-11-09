// Contact/brand details shown in the public site's footer/nav and reused in
// email templates. Not a pricing or business rule the spec asks to be
// database-driven, so a small constant here (unlike Service pricing, which
// must stay in the database). Moved out of public.controller.ts once the
// email service needed it too, to avoid a service importing a controller.
export const BUSINESS_CONTACT = {
  brand: "Amanda's",
  tagline: "Smart Cleaning, Swift Errand",
  email: "hello@amandas.example",
  phone: "+44 7000 000000",
  whatsapp: "447000000000",
  area: "Plymouth, Devon",
};
