const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

// All money is stored as integer pence to avoid floating-point errors.
export const formatPrice = (pence) => gbp.format(pence / 100);
