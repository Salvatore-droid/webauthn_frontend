import { startAuthentication, startRegistration } from "@simplewebauthn/browser"

const signupButton = document.querySelector("[data-signup]")
const loginButton = document.querySelector("[data-login]")
const emailInput = document.querySelector("[data-email]")
const modal = document.querySelector("[data-modal]")
const closeButton = document.querySelector("[data-close]")

signupButton.addEventListener("click", signup)
loginButton.addEventListener("click", login)
closeButton.addEventListener("click", () => modal.close())

const SERVER_URL = "https://webauthn-node-zg2k.onrender.com"
// const SERVER_URL="https://figerprint-auther-backend.onrender.com"

async function signup() {
  const email = emailInput.value.trim();
  if (!email) {
    showModalText("Please enter a valid email");
    return;
  }

  try {
    // 1. Get registration options
    const initResponse = await fetch(`${SERVER_URL}/init-register?email=${encodeURIComponent(email)}`, {
      credentials: "include"
    });
    
    const options = await initResponse.json();
    
    if (!initResponse.ok) {
      showModalText(options.error || "Failed to start registration");
      return;
    }

    // 2. Start WebAuthn registration
    const registrationJSON = await startRegistration(options);
    
    // 3. Verify registration
    const verifyResponse = await fetch(`${SERVER_URL}/verify-register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationJSON)
    });
    
    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok) {
      showModalText(verifyData.error || "Verification failed");
      return;
    }
    
    showModalText(verifyData.verified ? `Success! ${email} registered` : "Registration failed");
    
  } catch (error) {
    console.error("Signup error:", error);
    showModalText(error.message.includes("base64URLString") 
      ? "Browser error: Try a different browser or device"
      : "An unexpected error occurred");
  }
}

async function login() {
  const email = emailInput.value

  // 1. Get challenge from server
  const initResponse = await fetch(`${SERVER_URL}/init-auth?email=${email}`, {
    credentials: "include",
  })
  const options = await initResponse.json()
  if (!initResponse.ok) {
    showModalText(options.error)
  }

  // 2. Get passkey
  const authJSON = await startAuthentication(options)

  // 3. Verify passkey with DB
  const verifyResponse = await fetch(`${SERVER_URL}/verify-auth`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authJSON),
  })

  const verifyData = await verifyResponse.json()
  if (!verifyResponse.ok) {
    showModalText(verifyData.error)
  }
  if (verifyData.verified) {
    showModalText(`Successfully logged in ${email}`)
    setTimeout(() => {
      window.location.href = "https://webauthn-django.onrender.com/send-otp"; // Your redirect URL
    }, 2000);
  } else {
    showModalText(`Failed to log in`)
  }
}

function showModalText(text) {
  modal.querySelector("[data-content]").innerText = text
  modal.showModal()
}
