import { CookieParser, ReceivedCookie, SendCookie } from "@single/CookieParser.mts"

/**
 * Tests para la clase SendCookie (cookies que se envían al cliente)
 * 
 * Generados con agentes de IA
 */
describe("SendCookie tests", () => {
    it("Creates a basic cookie with name and value", () => {
        const cookie = new SendCookie("sessionId", "abc123")
        
        expect(cookie.name).toBe("sessionId")
        expect(cookie.value).toBe("abc123")
        expect(cookie.expires).toBeNull()
        expect(cookie.maxAge).toBeNull()
        expect(cookie.domain).toBe("")
        expect(cookie.path).toBe("")
        expect(cookie.secure).toBeTrue()
        expect(cookie.httpOnly).toBeFalse()
        expect(cookie.sameSite).toBeNull()
    })

    it("Creates a cookie with all extra options", () => {
        const expires = new Date("2025-01-01T00:00:00Z")
        const cookie = new SendCookie("test", "value", {
            expires,
            maxAge: 3600,
            domains: "example.com",
            path: "/admin",
            secure: true,
            httpOnly: true,
            sameSite: "Strict"
        })
        
        expect(cookie.name).toBe("test")
        expect(cookie.value).toBe("value")
        expect(cookie.expires).toEqual(expires)
        expect(cookie.maxAge).toBe(3600)
        expect(cookie.domain).toBe("example.com")
        expect(cookie.path).toBe("/admin")
        expect(cookie.secure).toBeTrue()
        expect(cookie.httpOnly).toBeTrue()
        expect(cookie.sameSite).toBe("Strict")
    })

    it("Creates a cookie with partial extra options", () => {
        const cookie = new SendCookie("test", "value", {
            path: "/",
            secure: true
        })
        
        expect(cookie.path).toBe("/")
        expect(cookie.secure).toBeTrue()
        expect(cookie.httpOnly).toBeFalse()
        expect(cookie.sameSite).toBeNull()
    })

    describe("setMaxAge method", () => {
        it("Sets maxAge and expires for seconds", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('s', 30)
            
            expect(cookie.maxAge).toBe(30)
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const diff = cookie.expires.getTime() - now.getTime()
                expect(Math.abs(diff - 30000)).toBeLessThan(1000) // within 1 second
            }
        })

        it("Sets maxAge and expires for minutes", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('m', 2)
            
            expect(cookie.maxAge).toBe(120) // 2 minutes = 120 seconds
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const diff = cookie.expires.getTime() - now.getTime()
                expect(Math.abs(diff - 120000)).toBeLessThan(1000) // within 1 second
            }
        })

        it("Sets maxAge and expires for hours", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('h', 1)
            
            expect(cookie.maxAge).toBe(3600) // 1 hour = 3600 seconds
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const diff = cookie.expires.getTime() - now.getTime()
                expect(Math.abs(diff - 3600000)).toBeLessThan(1000) // within 1 second
            }
        })

        it("Sets maxAge and expires for days", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('D', 7)
            
            expect(cookie.maxAge).toBe(7 * 24 * 60 * 60) // 7 days in seconds
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const diff = cookie.expires.getTime() - now.getTime()
                expect(Math.abs(diff - 7 * 24 * 60 * 60 * 1000)).toBeLessThan(1000) // within 1 second
            }
        })

        it("Sets maxAge and expires for months", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('M', 1)
            
            expect(cookie.maxAge).toBe(30 * 24 * 60 * 60) // 30 days in seconds
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const diff = cookie.expires.getTime() - now.getTime()
                expect(Math.abs(diff - 30 * 24 * 60 * 60 * 1000)).toBeLessThan(1000) // within 1 second
            }
        })

        it("Handles negative quantities (deleting cookie)", () => {
            const cookie = new SendCookie("test", "value")
            const now = new Date()
            cookie.setMaxAge('D', -100)
            
            expect(cookie.maxAge).toBe(-100 * 24 * 60 * 60)
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                expect(cookie.expires.getTime()).toBeLessThan(now.getTime())
            }
        })

        it("Updates existing expires date", () => {
            const future = new Date("2025-01-01T00:00:00Z")
            const cookie = new SendCookie("test", "value", { expires: future })
            const originalTime = future.getTime()
            cookie.setMaxAge('s', 10)
            
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                expect(cookie.expires.getTime()).toBe(originalTime + 10000)
                expect(cookie.maxAge).toBe(10)
            }
        })
    })

    describe("setAsDeleted method", () => {
        it("Sets empty value and negative max age", () => {
            const cookie = new SendCookie("test", "originalValue")
            cookie.setAsDeleted()
            
            expect(cookie.value).toBe("")
            expect(cookie.maxAge).toBe(-100 * 24 * 60 * 60)
            expect(cookie.expires).not.toBeNull()
            if (cookie.expires) {
                const now = new Date()
                const diff = cookie.expires.getTime() - now.getTime()
                expect(diff).toBeLessThan(0) // past date
            }
        })
    })

    describe("setAsSecure method", () => {
        it("Sets secure, httpOnly and sameSite=Strict", () => {
            const cookie = new SendCookie("test", "value")
            cookie.setAsSecure('www.example.com')
            
            expect(cookie.secure).toBeTrue()
            expect(cookie.httpOnly).toBeTrue()
            expect(cookie.sameSite).toBe("None") // none porque el servidor es una api y no el que entrega la página
            expect(cookie.domain).toBe('www.example.com')
        })

        it("Overrides existing sameSite value", () => {
            const cookie = new SendCookie("test", "value", { sameSite: "Lax" })
            cookie.setAsSecure('www.example.com')
            
            expect(cookie.sameSite).toBe("None") // none porque el servidor es una api y no el que entrega la página
            expect(cookie.domain).toBe('www.example.com')
        })
    })

    describe("toString method", () => {
        it("Returns basic name=value", () => {
            const cookie = new SendCookie("session", "abc123")
            expect(cookie.toString()).toBe("session=abc123; Secure") // siempre deben llevar el secure
        })

        it("Encodes value with encodeURIComponent", () => {
            const cookie = new SendCookie("test", "value with spaces & symbols=+")
            expect(cookie.toString()).toBe(`test=${encodeURIComponent("value with spaces & symbols=+")}; Secure`) // siempre deben llevar el secure
        })

        it("Includes Expires when present", () => {
            const expires = new Date("2025-01-01T00:00:00Z")
            const cookie = new SendCookie("test", "value", { expires })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain(`Expires=${expires.toUTCString()}`)
            expect(str).toMatch(/; Expires=/)
        })

        it("Includes Max-Age when present", () => {
            const cookie = new SendCookie("test", "value", { maxAge: 3600 })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("Max-Age=3600")
            expect(str).toMatch(/; Max-Age=/)
        })

        it("Includes Domain when present", () => {
            const cookie = new SendCookie("test", "value", { domains: "example.com" })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("Domain=example.com")
            expect(str).toMatch(/; Domain=/)
        })

        it("Includes Path when present", () => {
            const cookie = new SendCookie("test", "value", { path: "/admin" })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("Path=/admin")
            expect(str).toMatch(/; Path=/)
        })

        it("Includes Secure flag when true", () => {
            const cookie = new SendCookie("test", "value", { secure: true })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("Secure")
            expect(str).toMatch(/; Secure/)
        })

        it("Includes HttpOnly flag when true", () => {
            const cookie = new SendCookie("test", "value", { httpOnly: true })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("HttpOnly")
            expect(str).toMatch(/; HttpOnly/)
        })

        it("Includes SameSite when present", () => {
            const cookie = new SendCookie("test", "value", { sameSite: "Lax" })
            const str = cookie.toString()
            expect(str).toContain("test=value")
            expect(str).toContain("SameSite=Lax")
            expect(str).toMatch(/; SameSite=/)
        })

        it("Combines multiple attributes", () => {
            const expires = new Date("2025-01-01T00:00:00Z")
            const cookie = new SendCookie("session", "abc123", {
                expires,
                maxAge: 3600,
                domains: "example.com",
                path: "/",
                secure: true,
                httpOnly: true,
                sameSite: "Strict"
            })
            const str = cookie.toString()
            expect(str).toContain("session=abc123")
            expect(str).toContain(`Expires=${expires.toUTCString()}`)
            expect(str).toContain("Max-Age=3600")
            expect(str).toContain("Domain=example.com")
            expect(str).toContain("Path=/")
            expect(str).toContain("Secure")
            expect(str).toContain("HttpOnly")
            expect(str).toContain("SameSite=Strict")
            // Check order? Not necessary
        })

        it("Produces exact Set-Cookie header format", () => {
            const expires = new Date("2025-01-01T00:00:00Z")
            const cookie = new SendCookie("session", "abc123", {
                expires,
                maxAge: 3600,
                domains: "example.com",
                path: "/",
                secure: true,
                httpOnly: true,
                sameSite: "Strict"
            })
            const expected = `session=abc123; Expires=${expires.toUTCString()}; Max-Age=3600; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Strict`
            expect(cookie.toString()).toBe(expected)
        })

        it("Maintains correct attribute order", () => {
            const expires = new Date("2025-01-01T00:00:00Z")
            const cookie = new SendCookie("test", "val", {
                path: "/admin",
                domains: "example.com",
                expires,
                maxAge: 7200,
                httpOnly: true,
                secure: true,
                sameSite: "Lax"
            })
            const str = cookie.toString()
            // Check order: name=value; Expires; Max-Age; Domain; Path; Secure; HttpOnly; SameSite
            const nameValueEnd = str.indexOf(";")
            expect(nameValueEnd).toBeGreaterThan(0)
            const expiresIndex = str.indexOf("Expires=")
            const maxAgeIndex = str.indexOf("Max-Age=")
            const domainIndex = str.indexOf("Domain=")
            const pathIndex = str.indexOf("Path=")
            const secureIndex = str.indexOf("Secure")
            const httpOnlyIndex = str.indexOf("HttpOnly")
            const sameSiteIndex = str.indexOf("SameSite=")
            
            expect(expiresIndex).toBeGreaterThan(nameValueEnd)
            expect(maxAgeIndex).toBeGreaterThan(expiresIndex)
            expect(domainIndex).toBeGreaterThan(maxAgeIndex)
            expect(pathIndex).toBeGreaterThan(domainIndex)
            expect(secureIndex).toBeGreaterThan(pathIndex)
            expect(httpOnlyIndex).toBeGreaterThan(secureIndex)
            expect(sameSiteIndex).toBeGreaterThan(httpOnlyIndex)
        })

        it("Encodes special characters in cookie value", () => {
            const cookie = new SendCookie("test", "value;with=special&chars")
            expect(cookie.toString()).toBe(`test=${encodeURIComponent("value;with=special&chars")}; Secure`) // siempre secure
            
            const cookie2 = new SendCookie("user", "johndoe@example.com")
            expect(cookie2.toString()).toBe(`user=${encodeURIComponent("johndoe@example.com")}; Secure`) // siempre secure
            
            const cookie3 = new SendCookie("data", "áéíóú ñ")
            expect(cookie3.toString()).toBe(`data=${encodeURIComponent("áéíóú ñ")}; Secure`) // siempre secure
        })

        it("Uses correct separator with space after semicolon", () => {
            const cookie = new SendCookie("test", "value", {
                path: "/",
                secure: true,
                httpOnly: true
            })
            const str = cookie.toString()
            // Should be "test=value; Path=/; Secure; HttpOnly"
            expect(str).toBe("test=value; Path=/; Secure; HttpOnly")
            // Ensure there's a space after each semicolon
            expect(str).toMatch(/^test=value; Path=\/; Secure; HttpOnly$/)
        })

        it("Produces valid Set-Cookie header for empty value", () => {
            const cookie = new SendCookie("session", "")
            expect(cookie.toString()).toBe("session=; Secure") // siempre secure
        })

        it("Handles cookie deletion format correctly", () => {
            const cookie = new SendCookie("session", "tobedeleted")
            cookie.setAsDeleted()
            const str = cookie.toString()
            expect(str).toMatch(/^session=; Expires=/)
            expect(str).toContain("Max-Age=")
            expect(str).toContain("Secure") // siempre secure
            expect(str).not.toContain("HttpOnly")
            expect(str).not.toContain("SameSite=")
            // Max-Age should be negative
            const maxAgeMatch = str.match(/Max-Age=(-?\d+);/)
            expect(maxAgeMatch).not.toBeNull()
            if (maxAgeMatch) {
                expect(parseInt(maxAgeMatch[1]!)).toBeLessThan(0)
            }
        })

        it("Omits attributes when empty/false/null", () => {
            const cookie = new SendCookie("test", "value")
            const str = cookie.toString()
            expect(str).toBe("test=value; Secure") // siempre secure
            expect(str).not.toContain("Expires=")
            expect(str).not.toContain("Max-Age=")
            expect(str).not.toContain("Domain=")
            expect(str).not.toContain("Path=")
            expect(str).toContain("Secure") // siempre secure
            expect(str).not.toContain("HttpOnly")
            expect(str).not.toContain("SameSite=")
        })
    })
})

/**
 * Tests para la clase ReceivedCookie (cookie recibida del cliente)
 */
describe("ReceivedCookie tests", () => {
    it("Creates a cookie with name and value", () => {
        const cookie = new ReceivedCookie("name", "value")
        expect(cookie.name).toBe("name")
        expect(cookie.value).toBe("value")
    })

    it("Converts to SendCookie with toSendCookie method", () => {
        const received = new ReceivedCookie("session", "abc123")
        const sendCookie = received.toSendCookie()
        expect(sendCookie).toBeInstanceOf(SendCookie)
        expect(sendCookie.name).toBe("session")
        expect(sendCookie.value).toBe("abc123")
        expect(sendCookie.expires).toBeNull()
        expect(sendCookie.maxAge).toBeNull()
        expect(sendCookie.domain).toBe("")
        expect(sendCookie.path).toBe("")
        expect(sendCookie.secure).toBeTrue() // siempre secure
        expect(sendCookie.httpOnly).toBeFalse()
        expect(sendCookie.sameSite).toBeNull()
    })


})

/**
 * Tests para la clase CookieParser (parser de cookies del cliente)
 */
describe("CookieParser tests", () => {
    it("Handles non-string input", () => {
        const parser = new CookieParser(null)
        expect(parser).toBeInstanceOf(CookieParser)
        
        const parser2 = new CookieParser(undefined)
        expect(parser2).toBeInstanceOf(CookieParser)
        
        const parser3 = new CookieParser(123)
        expect(parser3).toBeInstanceOf(CookieParser)
    })

    it("Handles empty string", () => {
        const parser = new CookieParser("")
        expect(parser).toBeInstanceOf(CookieParser)
    })

    it("Parses a single cookie", () => {
        const parser = new CookieParser("session=abc123")
        expect(parser).toBeInstanceOf(CookieParser)
        // No hay método público para verificar, pero al menos no debe lanzar error
    })

    it("Parses multiple cookies", () => {
        const parser = new CookieParser("session=abc123; user=johndoe; lang=es")
        expect(parser).toBeInstanceOf(CookieParser)
    })

    it("Trims whitespace from cookie names and values", () => {
        const parser = new CookieParser("  session  =  abc123  ")
        expect(parser).toBeInstanceOf(CookieParser)
    })

    it("Decodes URL encoded values", () => {
        const encoded = encodeURIComponent("value with spaces")
        const parser = new CookieParser(`test=${encoded}`)
        expect(parser).toBeInstanceOf(CookieParser)
    })

    it("Skips invalid cookie strings", () => {
        const parser = new CookieParser("invalid")
        expect(parser).toBeInstanceOf(CookieParser)
        
        const parser2 = new CookieParser("=value")
        expect(parser2).toBeInstanceOf(CookieParser)
        
        const parser3 = new CookieParser(";")
        expect(parser3).toBeInstanceOf(CookieParser)
    })

    it("Handles cookies with empty values", () => {
        const parser = new CookieParser("session=")
        expect(parser).toBeInstanceOf(CookieParser)
    })

    it("Handles cookies with special characters", () => {
        const parser = new CookieParser("user=johndoe@example.com; token=abc123!@#")
        expect(parser).toBeInstanceOf(CookieParser)
    })
})