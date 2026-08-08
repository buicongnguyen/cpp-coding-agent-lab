#pragma once

#include <cctype>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

namespace course_agent {

class Json {
public:
    using array_t = std::vector<Json>;
    using object_t = std::map<std::string, Json>;

    Json() : value_(nullptr) {}
    Json(std::nullptr_t) : value_(nullptr) {}
    Json(bool value) : value_(value) {}
    Json(int value) : value_(static_cast<double>(value)) {}
    Json(std::size_t value) : value_(static_cast<double>(value)) {}
    Json(double value) : value_(value) {}
    Json(const char* value) : value_(std::string(value)) {}
    Json(std::string value) : value_(std::move(value)) {}
    Json(array_t value) : value_(std::move(value)) {}
    Json(object_t value) : value_(std::move(value)) {}

    static Json array() { return Json(array_t{}); }
    static Json object() { return Json(object_t{}); }

    bool is_null() const { return std::holds_alternative<std::nullptr_t>(value_); }
    bool is_bool() const { return std::holds_alternative<bool>(value_); }
    bool is_number() const { return std::holds_alternative<double>(value_); }
    bool is_string() const { return std::holds_alternative<std::string>(value_); }
    bool is_array() const { return std::holds_alternative<array_t>(value_); }
    bool is_object() const { return std::holds_alternative<object_t>(value_); }

    bool as_bool() const { return get<bool>("boolean"); }
    double as_number() const { return get<double>("number"); }
    const std::string& as_string() const { return get<std::string>("string"); }
    const array_t& as_array() const { return get<array_t>("array"); }
    const object_t& as_object() const { return get<object_t>("object"); }
    array_t& as_array() { return get_mut<array_t>("array"); }
    object_t& as_object() { return get_mut<object_t>("object"); }

    std::size_t size() const {
        if (is_array()) return as_array().size();
        if (is_object()) return as_object().size();
        if (is_string()) return as_string().size();
        return 0;
    }

    bool contains(const std::string& key) const {
        if (!is_object()) return false;
        return as_object().find(key) != as_object().end();
    }

    Json& operator[](const std::string& key) {
        if (is_null()) value_ = object_t{};
        if (!is_object()) throw std::runtime_error("JSON value is not an object");
        return as_object()[key];
    }

    const Json& at(const std::string& key) const {
        if (!is_object()) throw std::runtime_error("JSON value is not an object");
        const auto it = as_object().find(key);
        if (it == as_object().end()) throw std::runtime_error("Missing JSON key: " + key);
        return it->second;
    }

    Json& at(const std::string& key) {
        if (!is_object()) throw std::runtime_error("JSON value is not an object");
        const auto it = as_object().find(key);
        if (it == as_object().end()) throw std::runtime_error("Missing JSON key: " + key);
        return it->second;
    }

    const Json& at(std::size_t index) const {
        if (!is_array() || index >= as_array().size()) throw std::runtime_error("JSON array index out of range");
        return as_array()[index];
    }

    void push_back(Json value) {
        if (is_null()) value_ = array_t{};
        if (!is_array()) throw std::runtime_error("JSON value is not an array");
        as_array().push_back(std::move(value));
    }

    std::string string_or(const std::string& fallback) const {
        return is_string() ? as_string() : fallback;
    }

    double number_or(double fallback) const {
        return is_number() ? as_number() : fallback;
    }

    std::string dump(int indent = -1) const {
        std::ostringstream out;
        dump_to(out, indent, 0);
        return out.str();
    }

    static Json parse(const std::string& text) {
        Parser parser(text);
        Json result = parser.parse_value();
        parser.skip_ws();
        if (!parser.at_end()) throw std::runtime_error("Unexpected data after JSON value");
        return result;
    }

private:
    using value_t = std::variant<std::nullptr_t, bool, double, std::string, array_t, object_t>;
    value_t value_;

    template <typename T>
    const T& get(const char* expected) const {
        const auto* value = std::get_if<T>(&value_);
        if (!value) throw std::runtime_error(std::string("JSON value is not a ") + expected);
        return *value;
    }

    template <typename T>
    T& get_mut(const char* expected) {
        auto* value = std::get_if<T>(&value_);
        if (!value) throw std::runtime_error(std::string("JSON value is not a ") + expected);
        return *value;
    }

    static void append_utf8(std::string& output, unsigned codepoint) {
        if (codepoint <= 0x7F) {
            output.push_back(static_cast<char>(codepoint));
        } else if (codepoint <= 0x7FF) {
            output.push_back(static_cast<char>(0xC0 | (codepoint >> 6)));
            output.push_back(static_cast<char>(0x80 | (codepoint & 0x3F)));
        } else if (codepoint <= 0xFFFF) {
            output.push_back(static_cast<char>(0xE0 | (codepoint >> 12)));
            output.push_back(static_cast<char>(0x80 | ((codepoint >> 6) & 0x3F)));
            output.push_back(static_cast<char>(0x80 | (codepoint & 0x3F)));
        } else {
            output.push_back(static_cast<char>(0xF0 | (codepoint >> 18)));
            output.push_back(static_cast<char>(0x80 | ((codepoint >> 12) & 0x3F)));
            output.push_back(static_cast<char>(0x80 | ((codepoint >> 6) & 0x3F)));
            output.push_back(static_cast<char>(0x80 | (codepoint & 0x3F)));
        }
    }

    static std::string escaped(const std::string& value) {
        std::ostringstream out;
        out << '"';
        for (const unsigned char ch : value) {
            switch (ch) {
            case '"': out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\b': out << "\\b"; break;
            case '\f': out << "\\f"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (ch < 0x20) {
                    out << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(ch)
                        << std::dec << std::setfill(' ');
                } else {
                    out << static_cast<char>(ch);
                }
            }
        }
        out << '"';
        return out.str();
    }

    void dump_to(std::ostringstream& out, int indent, int depth) const {
        if (is_null()) {
            out << "null";
        } else if (is_bool()) {
            out << (as_bool() ? "true" : "false");
        } else if (is_number()) {
            const double value = as_number();
            std::ostringstream number;
            if (std::isfinite(value) && std::floor(value) == value) number << std::fixed << std::setprecision(0) << value;
            else number << std::defaultfloat << std::setprecision(15) << value;
            out << number.str();
        } else if (is_string()) {
            out << escaped(as_string());
        } else if (is_array()) {
            out << '[';
            const auto& values = as_array();
            for (std::size_t i = 0; i < values.size(); ++i) {
                if (i != 0) out << ',';
                newline_and_indent(out, indent, depth + 1);
                values[i].dump_to(out, indent, depth + 1);
            }
            if (!values.empty()) newline_and_indent(out, indent, depth);
            out << ']';
        } else {
            out << '{';
            std::size_t index = 0;
            for (const auto& item : as_object()) {
                if (index++ != 0) out << ',';
                newline_and_indent(out, indent, depth + 1);
                out << escaped(item.first) << (indent >= 0 ? ": " : ":");
                item.second.dump_to(out, indent, depth + 1);
            }
            if (!as_object().empty()) newline_and_indent(out, indent, depth);
            out << '}';
        }
    }

    static void newline_and_indent(std::ostringstream& out, int indent, int depth) {
        if (indent < 0) return;
        out << '\n' << std::string(static_cast<std::size_t>(indent * depth), ' ');
    }

    class Parser {
    public:
        explicit Parser(const std::string& text) : text_(text) {}

        Json parse_value() {
            skip_ws();
            if (at_end()) fail("Expected JSON value");
            switch (peek()) {
            case 'n': consume_literal("null"); return Json(nullptr);
            case 't': consume_literal("true"); return Json(true);
            case 'f': consume_literal("false"); return Json(false);
            case '"': return Json(parse_string());
            case '[': return parse_array();
            case '{': return parse_object();
            default:
                if (peek() == '-' || std::isdigit(static_cast<unsigned char>(peek()))) return Json(parse_number());
                fail("Unexpected character while parsing JSON");
            }
        }

        void skip_ws() {
            while (!at_end() && std::isspace(static_cast<unsigned char>(peek()))) ++position_;
        }

        bool at_end() const { return position_ >= text_.size(); }

    private:
        const std::string& text_;
        std::size_t position_ = 0;

        char peek() const { return text_[position_]; }
        char take() {
            if (at_end()) fail("Unexpected end of JSON input");
            return text_[position_++];
        }

        [[noreturn]] void fail(const std::string& message) const {
            throw std::runtime_error(message + " at byte " + std::to_string(position_));
        }

        void expect(char expected) {
            if (take() != expected) fail(std::string("Expected '") + expected + "'");
        }

        void consume_literal(const char* literal) {
            for (const char* current = literal; *current; ++current) {
                if (take() != *current) fail(std::string("Expected ") + literal);
            }
        }

        static unsigned hex_value(char ch) {
            if (ch >= '0' && ch <= '9') return static_cast<unsigned>(ch - '0');
            if (ch >= 'a' && ch <= 'f') return static_cast<unsigned>(ch - 'a' + 10);
            if (ch >= 'A' && ch <= 'F') return static_cast<unsigned>(ch - 'A' + 10);
            throw std::runtime_error("Invalid hex digit in JSON unicode escape");
        }

        unsigned parse_hex4() {
            unsigned value = 0;
            for (int i = 0; i < 4; ++i) value = (value << 4) | hex_value(take());
            return value;
        }

        std::string parse_string() {
            expect('"');
            std::string result;
            while (true) {
                if (at_end()) fail("Unterminated JSON string");
                const char ch = take();
                if (ch == '"') return result;
                if (static_cast<unsigned char>(ch) < 0x20) fail("Unescaped control character in JSON string");
                if (ch != '\\') {
                    result.push_back(ch);
                    continue;
                }
                const char escape = take();
                switch (escape) {
                case '"': result.push_back('"'); break;
                case '\\': result.push_back('\\'); break;
                case '/': result.push_back('/'); break;
                case 'b': result.push_back('\b'); break;
                case 'f': result.push_back('\f'); break;
                case 'n': result.push_back('\n'); break;
                case 'r': result.push_back('\r'); break;
                case 't': result.push_back('\t'); break;
                case 'u': {
                    unsigned codepoint = parse_hex4();
                    if (codepoint >= 0xD800 && codepoint <= 0xDBFF) {
                        if (take() != '\\' || take() != 'u') fail("Expected low surrogate");
                        const unsigned low = parse_hex4();
                        if (low < 0xDC00 || low > 0xDFFF) fail("Invalid low surrogate");
                        codepoint = 0x10000 + ((codepoint - 0xD800) << 10) + (low - 0xDC00);
                    }
                    append_utf8(result, codepoint);
                    break;
                }
                default: fail("Invalid JSON string escape");
                }
            }
        }

        double parse_number() {
            const std::size_t start = position_;
            if (peek() == '-') ++position_;
            if (at_end()) fail("Incomplete JSON number");
            if (peek() == '0') {
                ++position_;
            } else {
                if (!std::isdigit(static_cast<unsigned char>(peek()))) fail("Invalid JSON number");
                while (!at_end() && std::isdigit(static_cast<unsigned char>(peek()))) ++position_;
            }
            if (!at_end() && peek() == '.') {
                ++position_;
                if (at_end() || !std::isdigit(static_cast<unsigned char>(peek()))) fail("Invalid JSON fraction");
                while (!at_end() && std::isdigit(static_cast<unsigned char>(peek()))) ++position_;
            }
            if (!at_end() && (peek() == 'e' || peek() == 'E')) {
                ++position_;
                if (!at_end() && (peek() == '+' || peek() == '-')) ++position_;
                if (at_end() || !std::isdigit(static_cast<unsigned char>(peek()))) fail("Invalid JSON exponent");
                while (!at_end() && std::isdigit(static_cast<unsigned char>(peek()))) ++position_;
            }
            const std::string token = text_.substr(start, position_ - start);
            char* end = nullptr;
            const double value = std::strtod(token.c_str(), &end);
            if (!end || *end != '\0' || !std::isfinite(value)) fail("Invalid JSON number");
            return value;
        }

        Json parse_array() {
            expect('[');
            Json result = Json::array();
            skip_ws();
            if (!at_end() && peek() == ']') {
                ++position_;
                return result;
            }
            while (true) {
                result.push_back(parse_value());
                skip_ws();
                const char separator = take();
                if (separator == ']') return result;
                if (separator != ',') fail("Expected ',' or ']' in JSON array");
            }
        }

        Json parse_object() {
            expect('{');
            Json result = Json::object();
            skip_ws();
            if (!at_end() && peek() == '}') {
                ++position_;
                return result;
            }
            while (true) {
                skip_ws();
                if (at_end() || peek() != '"') fail("Expected string key in JSON object");
                const std::string key = parse_string();
                skip_ws();
                expect(':');
                result[key] = parse_value();
                skip_ws();
                const char separator = take();
                if (separator == '}') return result;
                if (separator != ',') fail("Expected ',' or '}' in JSON object");
            }
        }
    };
};

} // namespace course_agent
