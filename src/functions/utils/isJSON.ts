export default (input: any): boolean => {
  if (typeof input === 'string') {
    try {
      JSON.parse(input);

      return true;
    } catch (e) {
      return false;
    };
  };

  return true;
};