/**
 * Checks if we have an expired token response from the server
 * @returns {boolean} true if we have an expired token response from the server
 */
const checkExpiredToken = () => {
  if (window.performance && performance.getEntriesByType) {
    // avoid error in Safari 10, IE9- and other old browsers
    let navTiming = performance.getEntriesByType('navigation');
    if (navTiming.length > 0) {
      // still not supported as of Safari 14...
      let serverTiming = navTiming[0].serverTiming;
      if (serverTiming && serverTiming.length > 0) {
        // if this status is found, we know we have an expired token
        if (
          serverTiming[0].name === 'status' &&
          serverTiming[0].description === '418'
        ) {
          return true;
        } else return false;
      } else return false;
    }
  }
};

/**
 * Checks if we have an expired token response from the server.
 * If we do, we will try to fetch a new token using our refresh token.
 * If we successfully fetch a new token, we will redirect the current
 * page and a user object will be available in the page.
 * @returns {void} Returns nothing.
 */
const fetchToken = async () => {
  if (checkExpiredToken()) {
    const fetchOptions = {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const response = await fetch(
      'https://192.168.1.64:2000/api/v1/users/refresh',
      fetchOptions
    );

    if (response.ok) {
      window.location.reload();
    }
  }
};

/**
 * Makes a post request to the specified URL using the provided form data
 * @param {string} url The url we will fetch from
 * @param {FormData Object} formData The date from the form
 * @returns {response} Returns either a response json object or an error
 */
const postFormDataAsJson = async ({ url, formData }) => {
  const plainFormData = Object.fromEntries(formData.entries());
  const formDataJsonString = JSON.stringify(plainFormData);

  const fetchOptions = {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: formDataJsonString,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Logs a user out of the application. If successful, we redirect to the home page.
 * @param {event} event The event that triggered the callback (should be form submit)
 * @returns {void} Does not return anything
 */
// const logout = async event => {
//   event.preventDefault();
//   const form = event.currentTarget;
//   const url = form.action;

//   try {
//     const formData = new FormData(form);
//     const responseData = await postFormDataAsJson({ url, formData });
//     if (responseData.ok) {
//       window.location.replace('https://192.168.1.64:2000/');
//     }
//   } catch (error) {
//     console.error(error);
//   }
// };

/**
 * Logs a user out of the application. If successful, we redirect to the home page.
 * @param {event} event The event that triggered the callback (should be form submit)
 * @returns {void} Does not return anything
 */
const handleFormSubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const url = form.action;

  try {
    const formData = new FormData(form);
    const responseData = await postFormDataAsJson({ url, formData });
    console.log(responseData);
    if (responseData.ok) {
      window.location.replace('https://192.168.1.64:2000/');
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * Adds an alert element to the DOM.
 * @param {string} message The message to be displayed on the alert
 * @param {string} type The type of alert to make
 * @returns {void} Retuns nothing
 */
function alert(message, type) {
  let alerts = document.querySelector('.alerts');

  let alertEl = document.createElement('div');
  alertEl.classList = `alert alert-${type}`;
  alertEl.setAttribute('role', 'alert');
  alertEl.innerHTML = `${message}<button type="button" class="btn-close alert-dismissible fade show" data-bs-dismiss="alert" aria-label="Close"></button>`;

  alerts.appendChild(alertEl);
}

fetchToken();

// This is to make the styles clean in mobile
// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

// grabbing the form and attaching an event listener for when the form submits
const signupButton = document.getElementById('signupButton'),
  registerPageForm = document.querySelector('#registerPageForm'),
  loginPageForm = document.querySelector('#loginPageForm'),
  logoutForm = document.querySelector('#logoutForm');

if (registerPageForm)
  registerPageForm.addEventListener('submit', handleFormSubmit);
if (signupButton)
  signupButton.addEventListener('click', function () {
    registerPageForm.submit();
  });
if (loginPageForm) loginPageForm.addEventListener('submit', handleFormSubmit);
if (logoutForm) logoutForm.addEventListener('submit', handleFormSubmit);
