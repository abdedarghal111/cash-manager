/**
 * Tests simples de Validator, por ahora solo se han añadido tests cruciales (los de escapar carácteres porque urge que funcione.)
 */
import { Validator } from "@single/Validator.mts"

describe("Validator tests", () => {
    describe("escapeHTML", () => {
        it("should not change a string with many normal characters", () => {
             const input = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!@#$^*()_+-=[]{}|;:"
             expect(Validator.escapeHTML(input)).toBe(input)
        })

        it("should escape the special characters", () => {
            const input = "&<>'\""
            const expected = "&amp;&lt;&gt;&#039;&quot;"
            expect(Validator.escapeHTML(input)).toBe(expected)
        })

        it("should handle xss attempt", () => {
            const input = "<script>alert('xss')</script>"
            const expected = "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
            expect(Validator.escapeHTML(input)).toBe(expected)
        })

        it("should handle empty string", () => {
            expect(Validator.escapeHTML("")).toBe("")
        })

        it("should handle mixed examples", () => {
             const input = "Hello <b>World</b> & 'friends'"
             const expected = "Hello &lt;b&gt;World&lt;/b&gt; &amp; &#039;friends&#039;"
             expect(Validator.escapeHTML(input)).toBe(expected)
        })
    })
})
