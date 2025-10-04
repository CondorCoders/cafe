# Guía de Configuración para Pruebas Locales

Esta guía describe los cambios necesarios para acceder a `/cafe` sin autenticación durante el desarrollo local.

## ⚠️ IMPORTANTE
Estos cambios **SOLO** deben usarse para pruebas locales. **Deben revertirse antes de hacer deploy a producción**.

---

## 🔧 Cambios Realizados

### 1. `/src/lib/supabase/middleware.ts`

#### Líneas 4-5: Rutas protegidas
```typescript
// COMENTADO - Original:
// const protectedRoutes = ["/cafe"];

// ACTUAL - Para pruebas locales:
// const protectedRoutes = ["/cafe"]; // Comentado para pruebas locales
const protectedRoutes: string[] = [];
```

#### Líneas 53-59: Redirección por error de auth
```typescript
// COMENTADO - Para pruebas locales:
// COMENTADO: Redireccion a login deshabilitada para pruebas locales
// If trying to access a protected route, redirect to login
// if (protectedRoutes.includes(request.nextUrl.pathname)) {
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

#### Líneas 64-70: Verificación de usuario
```typescript
// COMENTADO - Para pruebas locales:
// COMENTADO: Verificacion de usuario deshabilitada para pruebas locales
// if (!user && protectedRoutes.includes(request.nextUrl.pathname)) {
//   // no user, potentially respond by redirecting the user to the login page
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

#### Líneas 99-105: Redirección en catch de errores
```typescript
// COMENTADO - Para pruebas locales:
// COMENTADO: Redireccion a login deshabilitada para pruebas locales
// If trying to access a protected route, redirect to login
// if (protectedRoutes.includes(request.nextUrl.pathname)) {
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

---

### 2. `/src/app/cafe/page.tsx`

#### Líneas 21-24: Verificación de perfil
```typescript
// COMENTADO - Para pruebas locales:
// if (error) {
//   console.error("Error fetching profile:", error);
//   redirect("/auth/login");
// }
```

---

### 3. `/src/components/app-menu.tsx`

#### Línea 46: Tipo de prop `user`
```typescript
// MODIFICADO - Para pruebas locales:
interface AppSidebarProps {
  user: User | null; // Permite null para pruebas locales sin auth
}
```

**⚠️ REVERTIR A:**
```typescript
interface AppSidebarProps {
  user: User;
}
```

#### Líneas 83-86: Optional chaining en propiedades de usuario
```typescript
// MODIFICADO - Para pruebas locales:
<AvatarImage src={user?.profile_url || "/assets/default-avatar.png"} />
<AvatarFallback>{user?.full_name?.charAt(0) || "G"}</AvatarFallback>
</Avatar>
{user?.full_name || "Guest"}
```

**⚠️ REVERTIR A:**
```typescript
<AvatarImage src={user.profile_url} />
<AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
</Avatar>
{user.full_name}
```

#### Línea 74: Condicional para chat
```typescript
// MODIFICADO - Para pruebas locales:
{activeMenuItem === "chat" && user && <GeneralChat user={user} />}
```

**⚠️ REVERTIR A:**
```typescript
{activeMenuItem === "chat" && <GeneralChat user={user} />}
```

---

## 🔄 Cómo Revertir los Cambios

### Método Rápido (Buscar comentarios)
Busca en los archivos mencionados el texto:
- `// Comentado para pruebas locales`
- `// COMENTADO: Redireccion a login deshabilitada para pruebas locales`
- `// COMENTADO: Verificacion de usuario deshabilitada para pruebas locales`
- `// COMENTADO: Verificacion de perfil deshabilitada para pruebas locales`
- `// Permite null para pruebas locales sin auth`

Y descomenta/revierte los cambios marcados.

### Paso a Paso

1. **`/src/lib/supabase/middleware.ts`**
   - Restaurar: `const protectedRoutes = ["/cafe"];`
   - Descomentar las 3 verificaciones de rutas protegidas

2. **`/src/app/cafe/page.tsx`**
   - Descomentar el bloque `if (error) { ... redirect("/auth/login"); }`

3. **`/src/components/app-menu.tsx`**
   - Cambiar `user: User | null` a `user: User`
   - Eliminar optional chaining (`?.`) de las propiedades de user
   - Eliminar fallbacks (`|| "Guest"`, `|| "G"`, etc.)
   - Eliminar validación `user &&` en el chat

---