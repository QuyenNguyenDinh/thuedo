const WISHLIST_KEY = 'cosrent_wishlist';

export const getWishlist = (): string[] => {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isInWishlist = (id: string): boolean => {
  return getWishlist().includes(id);
};

export const toggleWishlist = (id: string): boolean => {
  const current = getWishlist();
  let updated: string[];
  const wasIn = current.includes(id);

  if (wasIn) {
    updated = current.filter((item) => item !== id);
  } else {
    updated = [...current, id];
  }

  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosrent_wishlist_change', { detail: updated }));
  } catch (e) {
    console.error('Lỗi khi lưu wishlist:', e);
  }

  return !wasIn;
};

