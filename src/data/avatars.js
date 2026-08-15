export const AVATARS = [
  // Fuego & Fiesta
  '🔥', '🌶️', '⚡', '😈', '😎', '🥳', '🤠', '👻', '👽', '🤖',
  // Animales Salvajes y Tiernos
  '🦁', '🐯', '🦊', '🐺', '🐼', '🐨', '🐵', '🐸', '🦄', '🐲',
  '🐶', '🐱', '🐰', '🐻', '🐧', '🦅', '🐙', '🦈',
  // Tragos & Previas
  '🍹', '🍸', '🍻', '🍷', '🥂', '🍾', '🍺', '🥃', '🍕',
  // Objetos & Vibes
  '👑', '💎', '🚀', '💣', '🎯', '🎸', '🎲', '🫦', '💋', '🔮', '🧸', '💀', '🧛', '💃', '🕺'
];

export const getRandomAvatar = () => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
};
