/* Configuración de Berry Run Online.
   Completa estos dos datos desde tu proyecto de Supabase:
   Project Settings › API → «Project URL» y «anon public» key.
   (La clave anon es pública por diseño; la seguridad la dan las políticas RLS de supabase.sql.)
   Mientras estén vacíos, la página funciona en modo demostración local. */
window.BERRY_CONFIG={
  SUPABASE_URL:"https://jvgehdrldyxeesvbxdtx.supabase.co",
  SUPABASE_ANON_KEY:"sb_publishable_cXGhtowJFmaiD8F1De7Inw_W0lTRe1n",
  MSG_BUDGET:90,      /* mensajes/segundo que usa la sala (el plan gratis permite ~100) */
  MAX_PLAYERS:60,     /* tope de jugadores por sala */
  GRACE_SECONDS:20    /* segundos que quedan al resto cuando el primero llega a la meta */
};
