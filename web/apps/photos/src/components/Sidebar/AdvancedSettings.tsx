import log from "@/next/log";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ScienceIcon from "@mui/icons-material/Science";
import { Box, DialogProps, Stack, Typography } from "@mui/material";
import { EnteDrawer } from "components/EnteDrawer";
import MenuSectionTitle from "components/Menu/MenuSectionTitle";
import Titlebar from "components/Titlebar";
import { MLSearchSettings } from "components/ml/MLSearchSettings";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";

import { VerticallyCenteredFlex } from "@ente/shared/components/Container";
import { EnteMenuItem } from "components/Menu/EnteMenuItem";
import { MenuItemGroup } from "components/Menu/MenuItemGroup";
import isElectron from "is-electron";
import { AppContext } from "pages/_app";
import { CLIPIndexingStatus, clipService } from "services/clip-service";
import { formatNumber } from "utils/number/format";

export default function AdvancedSettings({ open, onClose, onRootClose }) {
    const appContext = useContext(AppContext);
    const [mlSearchSettingsView, setMlSearchSettingsView] = useState(false);

    const openMlSearchSettings = () => setMlSearchSettingsView(true);
    const closeMlSearchSettings = () => setMlSearchSettingsView(false);

    const handleRootClose = () => {
        onClose();
        onRootClose();
    };

    const handleDrawerClose: DialogProps["onClose"] = (_, reason) => {
        if (reason === "backdropClick") {
            handleRootClose();
        } else {
            onClose();
        }
    };

    const toggleCFProxy = async () => {
        try {
            appContext.setIsCFProxyDisabled(!appContext.isCFProxyDisabled);
        } catch (e) {
            log.error("toggleFasterUpload failed", e);
        }
    };
    const [indexingStatus, setIndexingStatus] = useState<CLIPIndexingStatus>({
        indexed: 0,
        pending: 0,
    });

    useEffect(() => {
        clipService.setOnUpdateHandler(setIndexingStatus);
        clipService.getIndexingStatus().then((st) => setIndexingStatus(st));
        return () => clipService.setOnUpdateHandler(undefined);
    }, []);

    return (
        <EnteDrawer
            transitionDuration={0}
            open={open}
            onClose={handleDrawerClose}
            BackdropProps={{
                sx: { "&&&": { backgroundColor: "transparent" } },
            }}
        >
            <Stack spacing={"4px"} py={"12px"}>
                <Titlebar
                    onClose={onClose}
                    title={t("ADVANCED")}
                    onRootClose={handleRootClose}
                />

                <Box px={"8px"}>
                    <Stack py="20px" spacing="24px">
                        {isElectron() && (
                            <Box>
                                <MenuSectionTitle
                                    title={t("LABS")}
                                    icon={<ScienceIcon />}
                                />
                                <MenuItemGroup>
                                    <EnteMenuItem
                                        endIcon={<ChevronRight />}
                                        onClick={openMlSearchSettings}
                                        label={t("ML_SEARCH")}
                                    />
                                </MenuItemGroup>
                            </Box>
                        )}
                        <Box>
                            <MenuItemGroup>
                                <EnteMenuItem
                                    variant="toggle"
                                    checked={!appContext.isCFProxyDisabled}
                                    onClick={toggleCFProxy}
                                    label={t("FASTER_UPLOAD")}
                                />
                            </MenuItemGroup>
                            <MenuSectionTitle
                                title={t("FASTER_UPLOAD_DESCRIPTION")}
                            />
                        </Box>

                        {isElectron() && (
                            <Box>
                                <MenuSectionTitle
                                    title={t("MAGIC_SEARCH_STATUS")}
                                />
                                <Stack py={"12px"} px={"12px"} spacing={"24px"}>
                                    <VerticallyCenteredFlex
                                        justifyContent="space-between"
                                        alignItems={"center"}
                                    >
                                        <Typography>
                                            {t("INDEXED_ITEMS")}
                                        </Typography>
                                        <Typography>
                                            {formatNumber(
                                                indexingStatus.indexed,
                                            )}
                                        </Typography>
                                    </VerticallyCenteredFlex>
                                    <VerticallyCenteredFlex
                                        justifyContent="space-between"
                                        alignItems={"center"}
                                    >
                                        <Typography>
                                            {t("PENDING_ITEMS")}
                                        </Typography>
                                        <Typography>
                                            {formatNumber(
                                                indexingStatus.pending,
                                            )}
                                        </Typography>
                                    </VerticallyCenteredFlex>
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Stack>
            <MLSearchSettings
                open={mlSearchSettingsView}
                onClose={closeMlSearchSettings}
                onRootClose={handleRootClose}
            />
        </EnteDrawer>
    );
}
