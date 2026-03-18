package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"

	"github.com/valyala/fasthttp"
)

type LoginFetcher struct{}

type Session struct {
	PostResponse struct {
		StatusCode int `json:"status_code"`
		Lookup     struct {
			Identifier string `json:"identifier"`
			Digest     string `json:"digest"`
		} `json:"lookup"`
	} `json:"postResponse"`
	PassResponse struct {
		StatusCode int `json:"status_code"`
	} `json:"passResponse"`
	Cookies string `json:"Cookies"`
	Message string `json:"message"`
	Errors  string `json:"errors"`
}

type LoginResponse struct {
	Authenticated bool                   `json:"authenticated"`
	Session       map[string]interface{} `json:"session"`
	Lookup        any                    `json:"lookup"`
	Cookies       string                 `json:"cookies"`
	Status        int                    `json:"status"`
	Message       any                    `json:"message"`
	Errors        []string               `json:"errors"`
	Captcha       *CaptchaData           `json:"captcha,omitempty"`
}

type CaptchaData struct {
	Image   string `json:"image"`   // base64 encoded image
	Cdigest string `json:"cdigest"` // captcha digest
}

func (lf *LoginFetcher) Logout(token string) (map[string]interface{}, error) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	req.SetRequestURI("https://academia.srmist.edu.in/accounts/p/10002227248/logout?servicename=ZohoCreator&serviceurl=https://academia.srmist.edu.in")
	req.Header.SetMethod("GET")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("DNT", "1")
	req.Header.Set("Referer", "https://academia.srmist.edu.in/")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Cookie", token)

	if err := fasthttp.Do(req, resp); err != nil {
		return nil, err
	}

	bodyText := resp.Body()

	result := map[string]interface{}{
		"status": resp.StatusCode(),
		"result": string(bodyText),
	}
	return result, nil
}

func (lf *LoginFetcher) FetchCaptcha(cdigest string) (string, error) {
	url := fmt.Sprintf("https://academia.srmist.edu.in/accounts/p/40-10002227248/webclient/v1/captcha/%s?darkmode=false", cdigest)

	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	req.SetRequestURI(url)
	req.Header.SetMethod("GET")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
	req.Header.Set("Referer", "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36")
	req.Header.Set("cookie", "zalb_74c3a1eecc=18c2ae8cabb778c688e1dd5418e4505b; zalb_f0e8db9d3d=983d6a65b2f29022f18db52385bfc639; stk=843bc5ebcebcef8b08d349f27b55842b; zalb_3309580ed5=151b34e5142175e5024c18055cece0f8; CT_CSRF_TOKEN=d933d841-b40b-427e-bfd7-83dbb4176ba1; iamcsr=5547d81f41ddb2cd9e1df2bb815dacff32f0a605d0a439b94d267d51108d513b0c6557e76ceb08be4882a41d82141e0c17818610f5c4ab1884dd57e79c880c83; zccpn=290cd2fceee5e981c5d075053108921c56c050db75563e543b8ecd4ae1487e06952e133e0e6098a1dbf16fad3c563f68994dc871cb4c5c648af78620df74ad2e; _zcsr_tmp=290cd2fceee5e981c5d075053108921c56c050db75563e543b8ecd4ae1487e06952e133e0e6098a1dbf16fad3c563f68994dc871cb4c5c648af78620df74ad2e; cli_rgn=IN; JSESSIONID=79DACADBAAD213B7B4739C09F9D3F247")

	if err := fasthttp.Do(req, resp); err != nil {
		return "", fmt.Errorf("captcha request failed: %v", err)
	}

	if resp.StatusCode() != 200 {
		return "", fmt.Errorf("captcha HTTP error: %d", resp.StatusCode())
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &parsed); err != nil {
		return "", fmt.Errorf("failed to parse captcha JSON: %v", err)
	}

	captcha, ok := parsed["captcha"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("invalid captcha format: missing 'captcha' field")
	}

	imageBytes, ok := captcha["image_bytes"].(string)
	if !ok || imageBytes == "" {
		return "", fmt.Errorf("invalid captcha format: missing 'image_bytes'")
	}

	return imageBytes, nil
}

func (lf *LoginFetcher) Login(username, password string, cdigest, captcha *string) (*LoginResponse, error) {
	user := strings.Replace(username, "@srmist.edu.in", "", 1)

	// Use net/http with cookiejar — handles all cookies automatically like a browser
	jar, _ := cookiejar.New(nil)
	client := &http.Client{
		Jar:     jar,
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	baseUA := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
	baseURL := "https://academia.srmist.edu.in"
	orgID := "40-10002227248"

	// ── STEP 1: Load login page to seed cookies ──────────────────────────────
	initURL := fmt.Sprintf("%s/accounts/p/%s/signin?hide_fp=true&orgtype=40&service_language=en&serviceurl=%s",
		baseURL, orgID,
		url.QueryEscape(baseURL+"/portal/academia-academic-services/redirectFromLogin"))

	req1, _ := http.NewRequest("GET", initURL, nil)
	req1.Header.Set("User-Agent", baseUA)
	req1.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	client.Do(req1)

	// Get iamcsr from jar
	iamcsr := getCookieFromJar(jar, baseURL, "iamcsr")
	fmt.Printf("[DEBUG] iamcsr after init: %s\n", iamcsr)

	// ── STEP 2: Email lookup ──────────────────────────────────────────────────
	cliTime := time.Now().UnixMilli()
	lookupURL := fmt.Sprintf("%s/accounts/p/%s/signin/v2/lookup/%s@srmist.edu.in", baseURL, orgID, user)

	bodyStr := fmt.Sprintf("mode=primary&cli_time=%d&orgtype=40&service_language=en&serviceurl=%s",
		cliTime, url.QueryEscape(baseURL+"/portal/academia-academic-services/redirectFromLogin"))
	if cdigest != nil && captcha != nil {
		bodyStr += fmt.Sprintf("&captcha=%s&cdigest=%s", *captcha, *cdigest)
	}

	req2, _ := http.NewRequest("POST", lookupURL, strings.NewReader(bodyStr))
	req2.Header.Set("Accept", "*/*")
	req2.Header.Set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
	req2.Header.Set("Origin", baseURL)
	req2.Header.Set("Referer", fmt.Sprintf("%s/accounts/p/%s/signin", baseURL, orgID))
	req2.Header.Set("User-Agent", baseUA)
	req2.Header.Set("X-ZCSRF-TOKEN", "iamcsrcoo="+iamcsr)

	resp2, err := client.Do(req2)
	if err != nil {
		return nil, err
	}
	defer resp2.Body.Close()
	body2, _ := io.ReadAll(resp2.Body)

	var lookupData map[string]interface{}
	if err := json.Unmarshal(body2, &lookupData); err != nil {
		return nil, err
	}

	// Update iamcsr
	iamcsr = getCookieFromJar(jar, baseURL, "iamcsr")

	// Handle captcha/errors
	if errors, ok := lookupData["errors"].([]interface{}); ok && len(errors) > 0 {
		lookupMsg := errors[0].(map[string]interface{})["message"].(string)
		statusCode := int(lookupData["status_code"].(float64))
		if statusCode == 400 {
			if strings.Contains(lookupData["message"].(string), "HIP") || strings.Contains(lookupMsg, "HIP") {
				if cdigestVal, ok := lookupData["cdigest"].(string); ok && cdigestVal != "" {
					captchaImage, err := lf.FetchCaptcha(cdigestVal)
					if err != nil {
						return &LoginResponse{Authenticated: false, Status: statusCode, Message: lookupData["localized_message"].(string), Errors: []string{lookupMsg}, Captcha: &CaptchaData{Cdigest: cdigestVal}}, nil
					}
					return &LoginResponse{Authenticated: false, Status: statusCode, Message: lookupData["localized_message"].(string), Errors: []string{lookupMsg}, Captcha: &CaptchaData{Image: captchaImage, Cdigest: cdigestVal}}, nil
				}
				return &LoginResponse{Authenticated: false, Status: statusCode, Message: lookupData["localized_message"].(string), Errors: []string{lookupMsg}}, nil
			}
			return &LoginResponse{Authenticated: false, Status: statusCode, Message: lookupData["message"].(string), Errors: []string{lookupMsg}}, nil
		}
	}

	exists := strings.Contains(lookupData["message"].(string), "User exists")
	if !exists {
		if strings.Contains(lookupData["message"].(string), "HIP") {
			if cdigestVal, ok := lookupData["cdigest"].(string); ok && cdigestVal != "" {
				captchaImage, err := lf.FetchCaptcha(cdigestVal)
				if err != nil {
					return &LoginResponse{Authenticated: false, Status: int(lookupData["status_code"].(float64)), Message: lookupData["localized_message"].(string), Captcha: &CaptchaData{Cdigest: cdigestVal}}, nil
				}
				return &LoginResponse{Authenticated: false, Status: int(lookupData["status_code"].(float64)), Message: lookupData["localized_message"].(string), Captcha: &CaptchaData{Image: captchaImage, Cdigest: cdigestVal}}, nil
			}
			return &LoginResponse{Authenticated: false, Status: int(lookupData["status_code"].(float64)), Message: lookupData["localized_message"].(string)}, nil
		}
		return &LoginResponse{Authenticated: false, Status: int(lookupData["status_code"].(float64)), Message: lookupData["message"].(string)}, nil
	}

	lookup, ok := lookupData["lookup"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid lookup data")
	}

	identifier, _ := lookup["identifier"].(string)
	digest, _ := lookup["digest"].(string)

	// ── STEP 3: Password auth ─────────────────────────────────────────────────
	authURL := fmt.Sprintf(
		"%s/accounts/p/%s/signin/v2/primary/%s/password?digest=%s&cli_time=%d&servicename=ZohoCreator&service_language=en&serviceurl=%s",
		baseURL, orgID, identifier, digest, cliTime,
		url.QueryEscape(baseURL+"/portal/academia-academic-services/redirectFromLogin"),
	)

	authBody := fmt.Sprintf(`{"passwordauth":{"password":"%s"}}`, password)
	req3, _ := http.NewRequest("POST", authURL, strings.NewReader(authBody))
	req3.Header.Set("Accept", "*/*")
	req3.Header.Set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
	req3.Header.Set("Origin", baseURL)
	req3.Header.Set("Referer", fmt.Sprintf("%s/accounts/p/%s/signin", baseURL, orgID))
	req3.Header.Set("User-Agent", baseUA)
	req3.Header.Set("x-zcsrf-token", "iamcsrcoo="+iamcsr)

	resp3, err := client.Do(req3)
	if err != nil {
		return nil, err
	}
	defer resp3.Body.Close()
	body3, _ := io.ReadAll(resp3.Body)

	fmt.Printf("[DEBUG] Auth response: %.500s\n", string(body3))

	var authData map[string]interface{}
	json.Unmarshal(body3, &authData)

	// ── STEP 4: Follow redirect, detect sessions-reminder ───────────────────
	redirectURL := baseURL + "/portal/academia-academic-services/redirectFromLogin"
	if redirect, ok := authData["redirect"].(string); ok && redirect != "" {
		redirectURL = redirect
	}

	// Use a non-auto-redirect client so we can inspect each hop
	clientNoRedir := &http.Client{
		Jar:     jar,
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	req4, _ := http.NewRequest("GET", redirectURL, nil)
	req4.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req4.Header.Set("User-Agent", baseUA)
	req4.Header.Set("Referer", baseURL+"/")

	for i := 0; i < 10; i++ {
		resp4, err4 := clientNoRedir.Do(req4)
		if err4 != nil {
			break
		}
		loc := resp4.Header.Get("Location")
		statusCode4 := resp4.StatusCode
		resp4.Body.Close()

		nextURL := loc
		if nextURL == "" {
			nextURL = redirectURL
		}
		fmt.Printf("[DEBUG] Hop %d: status=%d loc=%s\n", i, statusCode4, nextURL)

		// Detect sessions-reminder — return it to frontend to handle
		if strings.Contains(nextURL, "sessions-reminder") {
			sessionReminderURL := fmt.Sprintf(
				"%s/accounts/p/40-10002227248/announcement/sessions-reminder?serviceurl=%s&service_language=en&orgtype=40",
				baseURL,
				url.QueryEscape(baseURL+"/portal/academia-academic-services/redirectFromLogin"),
			)
			fmt.Printf("[DEBUG] Session limit hit, returning redirect URL: %s\n", sessionReminderURL)
			return &LoginResponse{
				Authenticated: false,
				Status:        429,
				Message:       "Session limit reached. Please terminate other sessions and try again.",
				Session: map[string]interface{}{
					"sessionLimit": true,
					"redirectUrl":  sessionReminderURL,
				},
			}, nil
		}

		if statusCode4 == 200 || loc == "" {
			break
		}

		req4, _ = http.NewRequest("GET", nextURL, nil)
		req4.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
		req4.Header.Set("User-Agent", baseUA)
		req4.Header.Set("Referer", baseURL+"/")
		redirectURL = nextURL
	}

	// ── Collect ALL cookies from jar ──────────────────────────────────────────
	allCookies := getAllCookiesFromJar(jar, baseURL)
	fmt.Printf("[DEBUG] Final cookies from jar: %s\n", allCookies)

	var message string
	if msgVal, ok := authData["message"]; ok && msgVal != nil {
		message, _ = msgVal.(string)
	}

	if strings.Contains(strings.ToLower(message), "invalid") || allCookies == "" {
		return &LoginResponse{
			Authenticated: false,
			Session:       map[string]interface{}{"success": false, "message": message},
			Lookup:        map[string]string{"identifier": identifier, "digest": digest},
			Cookies:       allCookies,
			Status:        int(lookupData["status_code"].(float64)),
			Message:       message,
		}, nil
	}

	return &LoginResponse{
		Authenticated: true,
		Session:       map[string]interface{}{"success": true, "message": message},
		Lookup:        lookup,
		Cookies:       allCookies,
		Status:        int(lookupData["status_code"].(float64)),
		Message:       lookupData["message"],
	}, nil
}

// getCookieFromJar gets a specific cookie value from the jar
func getCookieFromJar(jar *cookiejar.Jar, rawURL, name string) string {
	u, _ := url.Parse(rawURL)
	for _, c := range jar.Cookies(u) {
		if c.Name == name {
			return c.Value
		}
	}
	return ""
}

// getAllCookiesFromJar returns all cookies as a single header string
func getAllCookiesFromJar(jar *cookiejar.Jar, rawURL string) string {
	u, _ := url.Parse(rawURL)
	cookies := jar.Cookies(u)
	var parts []string
	for _, c := range cookies {
		parts = append(parts, c.Name+"="+c.Value)
	}
	return strings.Join(parts, "; ")
}

// Helper functions kept for compatibility
func extractCookieMap(resp *fasthttp.Response) map[string]string {
	m := make(map[string]string)
	resp.Header.VisitAll(func(key, value []byte) {
		if strings.EqualFold(string(key), "Set-Cookie") {
			parts := strings.SplitN(string(value), ";", 2)
			if len(parts) > 0 {
				kv := strings.SplitN(strings.TrimSpace(parts[0]), "=", 2)
				if len(kv) == 2 {
					m[kv[0]] = kv[1]
				}
			}
		}
	})
	return m
}

func buildCookieString(m map[string]string) string {
	var parts []string
	for k, v := range m {
		parts = append(parts, k+"="+v)
	}
	return strings.Join(parts, "; ")
}

func mergeCookieStrings(base, newer string) string {
	m := make(map[string]string)
	for _, part := range strings.Split(base, "; ") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) == 2 {
			m[kv[0]] = kv[1]
		}
	}
	for _, part := range strings.Split(newer, "; ") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) == 2 {
			m[kv[0]] = kv[1]
		}
	}
	return buildCookieString(m)
}

func (lf *LoginFetcher) GetSession(password string, lookup map[string]interface{}, sessionCookies map[string]string, iamcsr string, cliTime int64) (map[string]interface{}, string, error) {
	return map[string]interface{}{}, "", nil
}

func (lf *LoginFetcher) Cleanup(cookie string) (int, error) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	req.SetRequestURI("https://academia.srmist.edu.in/accounts/p/10002227248/webclient/v1/account/self/user/self/activesessions")
	req.Header.SetMethod("DELETE")
	req.Header.Set("accept", "*/*")
	req.Header.Set("content-type", "application/x-www-form-urlencoded;charset=UTF-8")
	req.Header.Set("x-zcsrf-token", "iamcsrcoo=8cbe86b2191479b497d8195837181ee152bcfd3d607f5a15764130d8fd8ebef9d8a22c03fd4e418d9b4f27a9822f9454bb0bf5694967872771e1db1b5fbd4585")
	req.Header.Set("Referer", "https://academia.srmist.edu.in/accounts/p/10002227248/announcement/sessions-reminder?servicename=ZohoCreator&serviceurl=https://academia.srmist.edu.in/portal/academia-academic-services/redirectFromLogin&service_language=en")
	req.Header.Set("Referrer-Policy", "strict-origin-when-cross-origin")
	req.Header.Set("cookie", cookie)

	if err := fasthttp.Do(req, resp); err != nil {
		return 0, err
	}

	return resp.StatusCode(), nil
}
