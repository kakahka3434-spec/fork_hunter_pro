use rand::seq::SliceRandom;
use rand::Rng;

use crate::auth_module::models::BrowserFingerprint;

/// Generates unique, realistic browser fingerprints for anti-detection
pub struct FingerprintGenerator;

impl FingerprintGenerator {
    /// Generate a unique browser fingerprint with realistic values
    pub fn generate_unique() -> BrowserFingerprint {
        let mut rng = rand::thread_rng();

        BrowserFingerprint {
            canvas_hash: Self::generate_hash(&mut rng),
            webgl_hash: Self::generate_hash(&mut rng),
            webgl_vendor: Self::random_webgl_vendor(&mut rng),
            webgl_renderer: Self::random_webgl_renderer(&mut rng),
            fonts: Self::random_fonts(&mut rng),
            screen_resolution: Self::random_resolution(&mut rng),
            color_depth: *[24, 32].choose(&mut rng).unwrap(),
            device_memory: *[4, 8, 16].choose(&mut rng).unwrap(),
            hardware_concurrency: *[2, 4, 6, 8, 12, 16].choose(&mut rng).unwrap(),
            do_not_track: rng.gen_bool(0.3),
            web_rtc_enabled: rng.gen_bool(0.7),
            web_gl_enabled: true,
        }
    }

    fn generate_hash(rng: &mut impl Rng) -> String {
        let bytes: Vec<u8> = (0..16).map(|_| rng.gen()).collect();
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    fn random_webgl_vendor(rng: &mut impl Rng) -> String {
        let vendors = [
            "Google Inc. (NVIDIA)",
            "Google Inc. (AMD)",
            "Google Inc. (Intel)",
            "Google Inc.",
            "Intel Inc.",
            "NVIDIA Corporation",
            "ATI Technologies Inc.",
        ];
        vendors.choose(rng).unwrap().to_string()
    }

    fn random_webgl_renderer(rng: &mut impl Rng) -> String {
        let renderers = [
            "ANGLE (NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (Intel(R) Iris Xe Graphics Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0)",
        ];
        renderers.choose(rng).unwrap().to_string()
    }

    fn random_fonts(rng: &mut impl Rng) -> Vec<String> {
        let all_fonts = [
            "Arial",
            "Arial Black",
            "Calibri",
            "Cambria",
            "Cambria Math",
            "Comic Sans MS",
            "Consolas",
            "Courier New",
            "Georgia",
            "Impact",
            "Lucida Console",
            "Microsoft Sans Serif",
            "Palatino Linotype",
            "Segoe UI",
            "Tahoma",
            "Times New Roman",
            "Trebuchet MS",
            "Verdana",
            "Wingdings",
            "Symbol",
        ];

        let count = rng.gen_range(12..=18);
        let mut fonts: Vec<&str> = all_fonts.to_vec();
        fonts.shuffle(rng);
        fonts.truncate(count);
        fonts.iter().map(|f| f.to_string()).collect()
    }

    fn random_resolution(rng: &mut impl Rng) -> (u32, u32) {
        let resolutions = [
            (1920, 1080),
            (2560, 1440),
            (1366, 768),
            (1440, 900),
            (1536, 864),
            (1680, 1050),
            (1280, 720),
            (1600, 900),
            (3840, 2160),
            (2560, 1600),
        ];
        *resolutions.choose(rng).unwrap()
    }

    /// Validate that a fingerprint has consistent values
    pub fn validate(fingerprint: &BrowserFingerprint) -> bool {
        !fingerprint.canvas_hash.is_empty()
            && !fingerprint.webgl_hash.is_empty()
            && !fingerprint.webgl_vendor.is_empty()
            && !fingerprint.webgl_renderer.is_empty()
            && !fingerprint.fonts.is_empty()
            && fingerprint.screen_resolution.0 > 0
            && fingerprint.screen_resolution.1 > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_valid_fingerprint() {
        let fp = FingerprintGenerator::generate_unique();
        assert!(FingerprintGenerator::validate(&fp));
        assert!(!fp.canvas_hash.is_empty());
        assert!(!fp.fonts.is_empty());
        assert!(fp.screen_resolution.0 > 0);
    }

    #[test]
    fn fingerprints_are_unique() {
        let fp1 = FingerprintGenerator::generate_unique();
        let fp2 = FingerprintGenerator::generate_unique();
        // Hash collision is astronomically unlikely
        assert_ne!(fp1.canvas_hash, fp2.canvas_hash);
    }
}
