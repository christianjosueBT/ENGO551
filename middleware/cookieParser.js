export default async function (req, res, next) {
  const {
    headers: { cookie },
  } = req;
  if (cookie) {
    const values = cookie.split(';').reduce((res, item) => {
      const data = item.trim().split('=');
      return { ...res, [data[0]]: data[1] };
    }, {});
    req.cookies = values;
  } else req.cookies = {};
  return next();
}
