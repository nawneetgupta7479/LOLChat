
export const generateAvatarUrl = (fullName) => {
  // Using ui-avatars.com (no API key needed)
  const base = 'https://ui-avatars.com/api/';
  const name = encodeURIComponent(fullName || 'User');
  return `${base}?name=${name}&background=random&color=fff&size=256`;
};