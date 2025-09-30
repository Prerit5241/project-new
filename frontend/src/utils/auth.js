export function getUserRole() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return tokenPayload.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function isTokenExpired(token) {
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return tokenPayload.exp < currentTime;
  } catch (error) {
    return true;
  }
}
