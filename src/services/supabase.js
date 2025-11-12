// services/supabase.js
import { createClient } from '@supabase/supabase-js'

// Supabase credentials (⚠️ move to .env in production)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nadxrexpfcpnocnsjjbk.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZHhyZXhwZmNwbm9jbnNqamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjAwNzMsImV4cCI6MjA2NzAzNjA3M30.5T0hxDZabIJ_mTrtKpra3beb7OwnnvpNcUpuAhd28Mw'

// Only create the client if credentials are valid
let supabase = null
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    console.warn('Supabase credentials not configured.')
  }
} catch (error) {
  console.error('Error creating Supabase client:', error)
}

export { supabase }

// ===============================
// Database Service
// ===============================
export const databaseService = {
  // -------------------------
  // AUTH MANAGEMENT
  // -------------------------
  async signUp(email, password) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  },

  async signIn(email, password) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  async signOut() {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // -------------------------
  // PROJECTS
  // -------------------------
  async getProjects() {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.from('projects').select('*')
    return { data, error }
  },

  async getProjectById(uuid) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('uuid', uuid)
      .single();
    return { data, error };
  },

  async createProject(projectData) {
    // Remove id from projectData to let the database generate it
    const { id, ...dataWithoutId } = projectData;
    const { data, error } = await supabase
      .from('projects')
      .insert([dataWithoutId])
      .select();
    return { data, error };
  },

  async updateProject(uuid, updates) {
    // Don't allow updating the UUID
    const { id, uuid: _, ...updatesWithoutId } = updates;
    const { data, error } = await supabase
      .from('projects')
      .update(updatesWithoutId)
      .eq('uuid', uuid) // Use only the uuid column for the update
      .select(
        'uuid, project_name, project_description, start_date, end_date, status, client_name, leader_of_project, project_scope, project_responsibility, tech_stack, team_members'
      );
    return { data, error };
  },

  async deleteProject(uuid) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('uuid', uuid); // Use only the uuid column for deletion
    return { error };
  },

  // -------------------------
  // STRUCTURED PROJECT ID MANAGEMENT
  // -------------------------
  async getProjectFields() {
    const { data, error } = await supabase.from('project_fields').select('*').order('field_code')
    return { data, error }
  },

  async getNextSerialNumber() {
    const { data, error } = await supabase.rpc('get_next_serial_number')
    return { data, error }
  },

  async validateStructuredId(projectId) {
    const { data, error } = await supabase.rpc('validate_structured_project_id', { project_id: projectId })
    return { data, error }
  },

  async parseStructuredId(projectId) {
    const { data, error } = await supabase.rpc('parse_structured_project_id', { project_id: projectId })
    return { data, error }
  },

  async getProjectFieldStatistics() {
    const { data, error } = await supabase.from('project_field_statistics').select('*')
    return { data, error }
  },

  async getProjectsByField(fieldCode) {
    const { data, error } = await supabase.from('projects').select('*').eq('project_field_code', fieldCode).order('serial_number')
    return { data, error }
  },

  // -------------------------
  // ROLES MANAGEMENT
  // -------------------------
  async getRoles() {
    const { data, error } = await supabase.from('roles').select('*')
    return { data, error }
  },

  async createRole(roleData) {
    const { data, error } = await supabase.from('roles').insert([roleData]).select()
    return { data, error }
  },

  async updateRoleById(id, updates) {
    const { data, error } = await supabase.from('roles').update(updates).eq('id', id).select()
    return { data, error }
  },

  async deleteRoleById(id) {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    return { error }
  },

  // -------------------------
  // USER LOGINS & PERMISSIONS (user_perms table)
  // -------------------------
  async createUserLogin(userLoginData) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.from('user_perms').insert([userLoginData]).select()
    return { data, error }
  },

  async getAllUserLogins() {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.from('user_perms').select('*')
    return { data, error }
  },

  async getUserByEmail(email) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.from('user_perms').select('*').eq('email', email).single()
    return { data, error }
  },

  async updateUserLoginByEmail(email, updates) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.from('user_perms').update(updates).eq('email', email).select()
    return { data, error }
  },

  async deleteUserLoginByEmail(email) {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.from('user_perms').delete().eq('email', email)
    return { error }
  },

  async updateEmailPermissions(email, permissions) {
    // Only update permission_roles column based on email
    const { data, error } = await supabase
      .from('user_perms')
      .update({ permission_roles: permissions })
      .eq('email', email)
      .select()
    return { data, error }
  },
// -------------------------
  // ANNOUNCEMENTS
  // -------------------------
  async getAnnouncements() {
    const { data, error } = await supabase.from('announcements').select('*').order('timestamp', { ascending: false })
    return { data, error }
  },
  
  async createAnnouncement(announcementData) {
    const { data, error } = await supabase.from('announcements').insert([announcementData]).select()
    return { data, error }
  },
async deleteAnnouncement(id) {
  const { data, error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  return { data, error };
},  
  // -------------------------
  // API MANAGEMENT
  // -------------------------
  async getApis() {
    const { data, error } = await supabase.from('apis').select('*')
    return { data, error }
  },

  async createApi(apiData) {
    const { data, error } = await supabase.from('apis').insert([apiData]).select()
    return { data, error }
  },

  // -------------------------
  // CHATBOT MESSAGES
  // -------------------------
  async saveChatMessage(messageData) {
    const { data, error } = await supabase.from('chat_messages').insert([messageData]).select()
    return { data, error }
  },

  async getChatHistory(userId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // -------------------------
  // EMPLOYEE LOGIN LOGS
  // -------------------------
  getISTISOString() {
    const now = new Date()
    const istOffset = 330 // minutes
    const istTime = new Date(now.getTime() + istOffset * 60000)
    return istTime.toISOString().replace('Z', '+05:30')
  },

  async logEmployeeLogin({ email, name, password }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const login_time = this.getISTISOString()
    const { data, error } = await supabase
      .from('employee_login')
      .insert([{ email, name, pass: password, login_time, logout_time: null }])
      .select()
    return { data, error }
  },

  async logEmployeeLogout({ email }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }

    // find latest login with no logout_time
    const { data: latest, error: fetchError } = await supabase
      .from('employee_login')
      .select('*')
      .eq('email', email)
      .is('logout_time', null)
      .order('login_time', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !latest) {
      return { data: null, error: fetchError || { message: 'No active login found' } }
    }

    const logout_time = this.getISTISOString()
    const { data, error } = await supabase
      .from('employee_login')
      .update({ logout_time })
      .eq('id', latest.id)
      .select()

    return { data, error }
  },

  // -------------------------
  // CHAT ID MANAGEMENT
  // -------------------------
  async createChatId(projectId) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

    try {
      // Generate a random 6-character alphanumeric ID
      const generateRandomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
          .replace(/[^A-Z0-9]/g, '0')
          .padEnd(6, '0');
      };

      const chatId = generateRandomId();
      const currentTime = new Date().toISOString();

      // Insert the new chat ID with the exact format
      const { data, error } = await supabase
        .from('chat_id_counters')
        .insert([{
          project_id: projectId,
          chat_id: chatId,
          created_at: currentTime,
          updated_at: currentTime
        }])
        .select()
        .single();

      if (error) {
        // If there's a duplicate key error, try one more time
        if (error.code === '23505') { // Unique violation
          const newChatId = generateRandomId();
          const retry = await supabase
            .from('chat_id_counters')
            .insert([{
              project_id: projectId,
              chat_id: newChatId,
              created_at: currentTime,
              updated_at: currentTime
            }])
            .select()
            .single();
          
          if (retry.error) throw retry.error;
          return { data: { ...retry.data, chat_id: newChatId }, error: null };
        }
        throw error;
      }

      return { data: { ...data, chat_id: chatId }, error: null };
    } catch (error) {
      console.error('Error creating chat ID:', error);
      return {
        data: null,
        error: {
          message: error.message || 'Failed to create chat ID',
          details: error
        }
      };
    }
  },

  async getProjectChats(projectId) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };

    try {
      const { data, error } = await supabase
        .from('chat_id_counters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching project chats:', error);
      return { data: [], error };
    }
  }
}

