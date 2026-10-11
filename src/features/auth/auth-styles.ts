// One definition of how the account pages (sign in, forgot password, choose a password) size their
// form, so the three can never drift apart. Change a size here and all of them change together.

/**
 * Text boxes, including the password box. Phones get 16px text (smaller makes iOS zoom the page on
 * focus) and a 44px touch height; from md up they match the rest of the app, 40px with 14px text.
 */
export const AUTH_FIELD = "h-11 text-base md:h-10 md:text-sm lg:h-10 lg:text-sm";

/** The main button under the form. */
export const AUTH_SUBMIT = "h-11 w-full text-sm md:h-10 lg:h-10";

/** Vertical rhythm between the fields and the button. */
export const AUTH_FORM = "space-y-5";

/** The quiet "Back to sign in" link under a form. */
export const AUTH_BACK_LINK =
  "block py-3 text-center text-sm text-muted-foreground underline-offset-2 hover:underline";
