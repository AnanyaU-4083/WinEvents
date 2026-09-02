namespace EventManagementSystem.Dtos
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string MsEmail { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } // "Admin" | "Employee" | "Attendee"
    }
 
    public class LoginDto
    {
        public string Username { get; set; }
        public string MsEmail { get; set; }
        public string Password { get; set; }
    }
 
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string Role { get; set; }
    }
 
    // Returned after registration — never includes the password hash.
    public class UserDto
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string MsEmail { get; set; }
        public string Role { get; set; }
    }
}