import { useDispatch } from "react-redux";
import { login, register, getMe, logout } from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";
import { setCurrentChatId, setChats } from "../../chats/chat.slice";

export function useAuth() {
  const dispatch = useDispatch();

  async function handleRegister({ username, email, password }) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      await register({ username, email, password });
      return true;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || "Registration failed"));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleLogin({ email, password }) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const data = await login({ email, password });
      dispatch(setUser(data.user));
      return true;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || "Login failed"));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleGetMe() {
    try {
      dispatch(setLoading(true));
      const data = await getMe();
      dispatch(setUser(data.user));
    } catch (error) {
      if (error.response?.status !== 401) {
        dispatch(
          setError(
            error.response?.data?.message || "Failed to get user information",
          ),
        );
      }
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleLogout() {
    try {
      dispatch(setLoading(true));
      await logout();
    } catch (error) {
      console.error("Error in handleLogout:", error);
    } finally {
      dispatch(setUser(null));
      dispatch(setCurrentChatId(null));
      dispatch(setChats({}));
      dispatch(setError(null));
      localStorage.removeItem("currentChatId");
      dispatch(setLoading(false));
    }
  }

  return { handleRegister, handleLogin, handleGetMe, handleLogout };
}
